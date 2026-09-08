# Tauri 扩展与分层 —— 从修改开始初识 Tauri

参考：[dash-chat](https://github.com/dash-chat/dash-chat)

对于 Tauri，本身后端前端粘合一起，小项目很方便；项目大了却很难管理。偶然看到 dash-chat，组织得很简单清晰。

这里记录项目的搭建拆分过程，顺带梳理 Tauri 的启动流程。

![分层示意](../../../assets/Untitled%20Diagram.drawio.svg)

---

## 1. 入口怎么切

官方模板里，前端和 `src-tauri` 同级，`tauri.conf.json` 大致是：

```json
"build": {
  "beforeDevCommand": "pnpm dev",
  "devUrl": "http://localhost:1420",
  "beforeBuildCommand": "pnpm build",
  "frontendDist": "../dist"
}
```

前端独立成 `ui/` 之后，产物路径和脚本都要改。可以像下面这样直接 filter；也可以根上写 `"dev": "pnpm -F ui dev"`，Tauri 仍写 `pnpm dev`（dash-chat / 当前 lust 采用后者）：

```json
"build": {
  "beforeDevCommand": "pnpm --filter ui dev",
  "devUrl": "http://localhost:1420",
  "beforeBuildCommand": "pnpm --filter ui build",
  "frontendDist": "../ui/dist/client"
}
```

随应用分发的资源（安装包等）放在 `src-tauri/resources/`，由壳声明，不是 UI 的职责：

```json
"bundle": {
  "active": true,
  "targets": "all",
  "icon": [
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.icns",
    "icons/icon.ico"
  ],
  "resources": [
    "resources/Clash.Verge_2.5.2_x64-setup.exe"
  ]
}
```

---

## 2. 用 workspace 粘合

Tauri 已有启动 Cargo 和 pnpm 的入口，不用另起炉灶。从这两个入口出发，Cargo / pnpm 会**递归向上**查找根上的 workspace 标记。

通过 workspace，把其它 lib / 前端包纳入同一工程空间：

| | Cargo | pnpm |
|---|---|---|
| 标记文件 | 根 `Cargo.toml` 的 `[workspace]` | 根 `pnpm-workspace.yaml` |
| 怎么找 | 从当前包向上找 | 从当前目录向上找 |
| 成员名单 | `members = [...]` | `packages: [...]` |

没有「在 `package.json` 里依赖某个 `.rs`」这种事；边界靠约定和 workspace。

---

## 3. 前端入口

前端入口其实是 **Vite**。

两条路：

1. 只改 `tauri.conf.json`，指向其它前端包（`--dir ui` / 改 `frontendDist`）
2. 用 **pnpm workspace** 在根上编排，再链接多个包

多包 mono 时推荐第二种：根当编排壳，支持多前端应用。

### 原来怎么识别入口

改成 workspace 之前是单包：根 `package.json` 写 `"dev": "vite"`。在仓库根跑 Vite，找当前目录的 `vite.config` / `index.html`。Tauri 的 `beforeDevCommand` 也是根上的 `pnpm dev`，前端和 `src-tauri` 同级。

现在前端在 `ui/`：真正的 `dev` / `build` 在 `ui/package.json`。根 `package.json` 只是 workspace 壳，自己不再有 Vite。

### 为什么要 `--filter ui`

`pnpm-workspace.yaml` 把 `ui` 标成成员后，根包和 `ui` 是**两个包**：

| 位置 | `name` | 有没有 Vite 脚本 |
|---|---|---|
| 根 `/` | `lust` | 没有（只有转发） |
| `ui/` | `ui` | 有 `dev` / `build` |

`pnpm --filter ui dev`（短写 `-F ui`）按 **`package.json` 的 `name`** 选中那个包再跑脚本，不是按文件夹名猜（只是目录碰巧也叫 `ui`）。

成员再少也一样：根上的 `pnpm run vite` **不会**自动跑子包脚本。不 filter 的话，要么找不到 Vite，要么在错误的 CWD 跑。

等价写法：

```bash
pnpm --dir ui dev   # 或 pnpm -C ui dev
```

根上保留：

```json
"dev": "pnpm -F ui dev",
"build": "pnpm -F ui build",
"preview": "pnpm -F ui preview"
```

这样在仓库根和 Tauri 的 `beforeDevCommand: "pnpm dev"` 里都不用先 `cd ui`。

根上原来的 `react` / `vite` / `@types/*` 等依赖是**搬家到 `ui`**，不是叠加；根只留 `@tauri-apps/cli` 和编排脚本。

### `dev` / `build` / `preview`

| 命令 | 作用 |
|---|---|
| `dev` | 基于源码，实时编译 + HMR，没有 dist 也能跑 |
| `build` | 产出 dist（Tauri 打包吃 `frontendDist`） |
| `preview` | 起静态服务器读 dist，接近线上真实产物；**改代码必须重新 build** |

---

## 4. SSR 与 SPA

若 UI 是 TanStack Start：桌面壳没有长期 Node 服务，需要区分开发和打包。

在 `ui/vite.config.ts` 里按 Vite 的 `command` 分支打开 SPA：

- **`dev`（`command === 'serve'`）**：完整 SSR，路由直接渲染，预览稳定  
- **`build`**：`spa.enabled: true`，打出静态壳给 Tauri；`prerender` 生成 `/index.html`

不要为了「像桌面」在 `vite dev` 里强行开 SPA，否则容易首屏空壳、路由 notFound。

SSR 大方向：同一套 UI，先在 Node 里跑一遍生成 HTML，主要优化首屏；页面能力大多客户端也能做。

补充边界：

1. 优化首屏是最常见动机，还有 SEO、无 JS 基本可读性等——**桌面 Tauri 里这些通常不重要**。  
2. 不是所有能力都能搬到客户端：能搬的是画页面、交互、`invoke`；不能搬的是密钥、服务端鉴权等——那些靠 Server Function / 远程服务 / Rust，**不是 SSR 这个形式本身**。

一句话：**SSR ≈ 同一套 UI 先在 Node 生成 HTML；真正不能给浏览器的是受保护逻辑，不是 SSR。**

同时建议保留 Tauri 常用的 Vite 服务配置（dash-chat 同类写法）：

- `clearScreen: false` —— 不盖住 Rust 报错  
- 固定端口 + `strictPort` —— 与 `devUrl` 一致  
- `host` / `hmr` —— 照顾 WebView / 真机  
- `watch.ignored: ['**/src-tauri/**']` —— 避免误热更 Rust  

```ts
import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

const host = process.env.TAURI_DEV_HOST

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    // Dev: full SSR so `/` renders. Build: SPA shell for Tauri static assets.
    tanstackStart(
      command === 'build'
        ? {
            spa: {
              enabled: true,
              prerender: {
                outputPath: '/index.html',
                crawlLinks: false,
                retryCount: 0,
              },
            },
          }
        : undefined,
    ),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    // Bind IPv4 so Tauri/WebView2 can reach http://localhost:1420
    host: host || '127.0.0.1',
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
  },
}))

export default config
```

### 前端怎么调后端

在 `ui` 引入：

```json
"@tauri-apps/api": "^2"
```

```ts
import { invoke } from '@tauri-apps/api/core'

export async function installClash(): Promise<void> {
  await invoke('install_clash')
}
```

`invoke` 只是桥：Rust 侧要有对应的 `#[tauri::command]` 并挂进 `generate_handler!`，Tauri 2 还要在 capability 里放行。dash-chat 多数再包一层 `invokeAfterSetup`（等后端就绪），本质仍是前端调 `invoke`。

浏览器里单独 `pnpm dev` 没有 WebView IPC，`invoke` 会失败；要在 `tauri dev` 或打包后的壳里测。

---

## 5. Cargo workspace

原则：**新业务优先进 `crates/`，不要默认堆进 `src-tauri/src/lib.rs`。**  
`src-tauri` 只做粘合：解析资源路径、挂 plugin / capability、把 command 接到前端。

调用链示例：

```text
UI 按钮
  → invoke('install_clash')
  → src-tauri command（AppHandle / 资源路径）
  → crates 里的纯函数（如 Command::spawn）
```

### `profile.release`

这是给 `cargo build --release` / `tauri build` 用的优化档：二进制更小或更快，**编译更慢**。

Cargo 规定 `[profile.*]` **只能写在 workspace 根** `Cargo.toml`，不能写在 `src-tauri/Cargo.toml`。

| 项 | 作用 |
|---|---|
| `codegen-units = 1` | 整 crate 一块交给 LLVM，优化更好，编译更慢 |
| `lto = true` | 链接期优化 |
| `opt-level = 3` | 偏速度（官方体积指南更常推 `"s"` / `"z"`） |
| `panic = "abort"` | 去掉 unwind，体积更小 |
| `strip = true` | 去掉调试符号 |

```toml
[workspace]
members = ["crates/*", "src-tauri"]
resolver = "2"

# Moved from src-tauri/Cargo.toml: Cargo only allows [profile.*] at the workspace root.
# https://tauri.app/concept/size/#cargo-configuration
[profile.release]
codegen-units = 1
lto = true
opt-level = 3
panic = "abort"
strip = true
```

---

## 6. 目标目录与本地命令

```text
lust/
├── ui/                      # 前端独立包（Vite / TanStack Start）
├── src-tauri/               # Tauri 粘合层
│   ├── resources/           # 随应用分发的资源
│   └── src/lib.rs           # command：解析路径 → 调 crate
├── crates/
│   └── lust-clash-verge/    # 纯逻辑
├── Cargo.toml               # Rust workspace + profile.release
├── pnpm-workspace.yaml      # JS workspace
└── package.json             # 根编排：dev / build / preview / tauri
```

```bash
# 只看前端
pnpm -F ui dev

# 静态预览已 build 的产物
pnpm preview

# 桌面壳 + 前端（beforeDevCommand 会拉起 ui）
pnpm tauri dev
```

若提示 `Port 1420 is already in use`，先结束占用该端口的旧 Vite。

`pnpm tauri dev` 若卡在很早且几乎无编译日志，先看 `cargo metadata` / Rust 工具链是否正常——工具链半残时，往往还没跑到 Vite 和 `Compiling` 就会失败。

---

## 7. 小结

Tauri 小项目「前后端粘一起」是优势；大了以后，麻烦的是 **粘合层吞掉了业务边界**。

dash-chat 的清晰之处在于：

- UI 是独立产品面  
- Rust 业务可以是普通 crate  
- Tauri 是桌面粘合剂，不是唯一的代码篮子  

按这个方式扩展：加功能时优先加 crate 或加页面，而不是继续堆厚 `src-tauri`。分层完成之后，日常改动的上下文会小很多——这才是这次拆分的目的。
