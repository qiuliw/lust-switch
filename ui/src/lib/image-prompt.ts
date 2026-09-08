export const RELAY_BASE_URL = 'https://codexaizh.com/v1'
export const IMAGE_MODEL = 'gpt-image-2'

export function buildImageSkillPrompt(apiKey: string): string {
  const key = apiKey.trim()
  return `我的中转站 API 密钥：${key}

请直接在本机创建或更新图片生成技能 image-generator，不要只说明步骤，也不要向我回显、记录或输出上面的 API 密钥。

固定配置如下：
- 中转地址：${RELAY_BASE_URL}
- 图片模型：${IMAGE_MODEL}

请自动完成全部配置：

1. 创建或更新：
%USERPROFILE%\\.codex\\skills\\image-generator\\SKILL.md

2. 创建或更新：
%USERPROFILE%\\.codex\\skills\\image-generator\\scripts\\generate_image.py

3. 自动创建并写入配置文件：
%LOCALAPPDATA%\\Codex\\image-generator\\config.json

配置文件必须直接写入：
- base_url：${RELAY_BASE_URL}
- api_key：使用我在本提示第一行提供的密钥
- model：${IMAGE_MODEL}

技能必须在我说“生成图片”“帮我出图”“根据这段描述画一张图”时，运行本地 scripts\\generate_image.py；不得调用 Codex 内置图片生成。

图片接口必须调用：
base_url.rstrip("/") + "/images/generations"

默认参数：
- model=${IMAGE_MODEL}
- size=1024x1024
- quality=auto
- n=1
- response_format=b64_json
- 请求超时 600 秒
- 超时不自动重试

要求：
- 支持 b64_json 和 url 两种图片返回；
- 自动保存到当前项目的 outputs 文件夹；
- 文件名带时间戳且不重复；
- 成功后展示图片并给出绝对路径；
- 所有失败必须用简体中文说明真实原因；
- 只使用 Python 标准库或本机已有依赖；
- 配置完成后只做脚本语法检查，不联网、不生成测试图片。

全部完成后，只回复：
图片生成技能已配置完成
`
}
