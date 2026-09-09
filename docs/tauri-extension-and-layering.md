# Tauri 扩展与分层

参考：[dash-chat](https://github.com/dash-chat/dash-chat)

Tauri 把前后端粘在一起，小项目很方便；项目大了边界容易糊掉。dash-chat 的组织方式简单清晰——这里记录大致的拆分过程

![分层示意](../../../assets/Untitled%20Diagram.drawio.svg)

## 用 workspace 粘合

Tauri 已有 Cargo / pnpm 入口，不必另起炉灶。从这两个入口出发，二者都会**向上**查找 workspace 标记；把其它 lib / 前端包加进成员即可。

| | Cargo | pnpm |
| -- | -- | |
| 标记文件 | 根 `Cargo.toml` 的 `[workspace]` | 根 `pnpm-workspace.yaml` |
| 怎么找 | 从当前包向上找 | 从当前目录向上找 |
| 成员名单 | `members = [...]` | `packages: [...]` |

没有「在 `package.json` 里依赖某个 `.rs`」这种事；边界靠约定和 workspace。

## 前端入口

前端入口是 **Vite**。两条路：

1. 直接只改 `tauri.conf.json`，指向其它前端包
2. 用 **pnpm workspace** 在根上编排，再链接多个包

多包 mono 推荐第二种：根当编排壳，方便多个前端应用。

### 入口迁移

前端独立成 `ui/` 后，改 `frontendDist`，并用根脚本或 `--filter` 指向 `ui`。本仓库根上转发，`tauri.conf.json` 仍写 `pnpm dev` / `pnpm build`：

```json
"build": {
  "beforeDevCommand": "pnpm dev",
  "devUrl": "http://localhost:1420",
  "beforeBuildCommand": "pnpm build",
  "frontendDist": "../ui/dist/client"
}
```

拆分前：根上直接 `"dev": "vite"`，Vite 配置和 `index.html` 都在仓库根。

拆分后：Vite 搬进 `ui/`，根包只做 workspace 壳。根与 `ui` 是两个包，根上的脚本不会自动跑到子包，所以要用 `--filter ui`（或 `-F ui` / `--dir ui`）点名执行。根上保留转发后，`beforeDevCommand` 仍可写 `pnpm dev`：

```json
"dev": "pnpm -F ui dev",
"build": "pnpm -F ui build",
"preview": "pnpm -F ui preview"
```

`dev` 吃源码（HMR）；`build` 出 dist 给 Tauri；`preview` 读 dist 做静态预览，改代码要重新 build。

### 依赖迁移

根上原来的前端依赖**搬到 `ui`**，不是叠加。根只留编排脚本和 `@tauri-apps/cli`；前端包自己带 Vite / React，并引入 `@tauri-apps/api` 调后端。

拆分前（根 `package.json`）：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "tauri": "tauri"
  },
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@tauri-apps/api": "^2",
    "@tauri-apps/plugin-opener": "^2"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^6.0.2",
    "typescript": "~6.0.3",
    "vite": "^8.0.16",
    "@tauri-apps/cli": "^2"
  }
}
```

拆分后：

```json
// 根 package.json —— 只剩壳
{
  "scripts": {
    "dev": "pnpm -F ui dev",
    "build": "pnpm -F ui build",
    "preview": "pnpm -F ui preview",
    "tauri": "tauri"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2"
  }
}
```

```json
// ui/package.json —— 前端依赖落在这里（节选）
{
  "dependencies": {
    "@tauri-apps/api": "^2",
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^6.0.1",
    "typescript": "^6.0.2",
    "vite": "^8.0.0"
  }
}
```

### SSR 与 SPA

桌面壳没有长期 Node 服务：`dev` 用完整 SSR 方便预览；`build` 开 SPA，打出静态壳给 Tauri。SSR 主要优化首屏；交互和 `invoke` 仍在客户端。密钥等受保护逻辑放 Rust / 远端，不是 SSR 本身。

```ts
tanstackStart(
  command === "build"
    ? {
        spa: {
          enabled: true,
          prerender: {
            outputPath: "/index.html",
            crawlLinks: false,
            retryCount: 0,
          },
        },
      }
    : undefined,
);
```

### 开发迁移

从 Tauri 模板 `vite.config.ts` 迁过来的开发服务器配置 `ui/vite.config.ts`（与 `devUrl` 对齐）：

```ts
const host = process.env.TAURI_DEV_HOST

clearScreen: false,
server: {
  port: 1420,
  strictPort: true,
  host: host || '127.0.0.1',
  hmr: host
    ? { protocol: 'ws', host, port: 1421 }
    : undefined,
  watch: { ignored: ['**/src-tauri/**'] },
},
```

前端用 `@tauri-apps/api` 的 `invoke` 调 Rust；单独浏览器 `pnpm dev` 没有 IPC，要在 `tauri dev` 里测。

## Cargo workspace

原则：**新业务优先进 `crates/`，不要默认堆进 `src-tauri/src/lib.rs`。**  
`src-tauri` 只做粘合和环境交互壳：解析资源路径、挂 plugin / capability、把 command 接到前端。

```text
UI 按钮
  → invoke('install_clash')
  → src-tauri command（AppHandle / 资源路径）
  → crates 里的纯函数
```

### `profile.release`

`[profile.release]` 是 release / `tauri build` 的优化档，只能写在 **workspace 根** `Cargo.toml`（不能写在 `src-tauri`）。细项见 [Tauri 体积指南](https://tauri.app/concept/size/#cargo-configuration)。

```toml
[workspace]
members = ["crates/*", "src-tauri"]
resolver = "2"

[profile.release]
codegen-units = 1
lto = true
opt-level = 3
panic = "abort"
strip = true
```

## 目录与日常命令

```text
lust/
├── ui/                      # 前端独立包（Vite / TanStack Start）
├── src-tauri/               # Tauri 粘合层
│   ├── resources/           # 随应用分发的资源
│   └── src/lib.rs           # command：解析路径 → 调 crate
├── crates/                  # 纯 Rust 业务
├── Cargo.toml               # Rust workspace + profile.release
├── pnpm-workspace.yaml      # JS workspace
└── package.json             # 根编排：dev / build / preview / tauri
```

```bash
pnpm -F ui dev    # 只看前端
pnpm preview      # 静态预览已 build 的产物
pnpm tauri dev    # 桌面壳 + 前端
```

## 小结

对于一个项目来说，边界看不见但却是落笔就要无形中考虑的，令逻辑更加清晰，功能和扩展便利
