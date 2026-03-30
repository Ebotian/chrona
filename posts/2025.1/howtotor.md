---
date: 2025-01-19
---

本文写现在如何在 clash(mihomo)配置完成之后通过网桥链接 tor 网络

我的环境变量

```bash
$ cat /etc/environment
#
# This file is parsed by pam_env module
#
# Syntax: simple "KEY=VAL" pairs on separate lines
#
#
XDG_SESSION_TYPE=wayland
XDG_CURRENT_DESKTOP=Hyprland

http_proxy="http://127.0.0.1:7890"
https_proxy="http://127.0.0.1:7890"
HTTP_PROXY="http://127.0.0.1:7890"
HTTPS_PROXY="http://127.0.0.1:7890"
all_proxy="socks5://127.0.0.1:7891"
ALL_PROXY="socks5://127.0.0.1:7891"
no_proxy="127.0.0.1,localhost,.local"
NO_PROXY="127.0.0.1,localhost,.local"
```

需要安装这些软件

```bash
yay -S tor obfs4proxy
```

开启服务:

```bash
sudo systemctl enable tor
sudo systemctl start tor
```

发邮件获取网桥(我使用 google 邮箱):

收件人: `bridges@torproject.org`

主题:`get transport obfs4`

内容:(空)

回信示例:

```txt
bridges@torproject.org

附件00:39 (20小时前)

发送至 我
[This is an automated email.]

Here is your bridge:

<你的网桥>

If it doesn't work, you can try this other bridge:

<你的网桥>

If you are using Tor Browser:

1. Choose "☰ ▸ Settings ▸ Tor" to open your Tor settings.

2. In the "Bridges" section, enter your bridge in the "Provide a bridge" field.

If you are using Tails, enter your bridge in the Tor Connection assistant.

If these bridges are not what you need, reply to this email with one of
the following commands in the message body:

  get bridges            (Request default Tor bridges.)
  get ipv6               (Request IPv6 bridges.)
  get transport obfs4    (Request obfs4 obfuscated bridges.)
  get vanilla            (Request unobfuscated Tor bridges.)
```

编辑这个

```bash
nvim /etc/tor/torrc
```

在最后加上这些:

```bash
## 启用网桥模式
UseBridges 1

## 告诉 Tor 使用 obfs4proxy 进行混淆传输
ClientTransportPlugin obfs4 exec /usr/bin/obfs4proxy

## 将你从邮件中得到的 Bridge 行粘贴到此处
## 注意，每行前加上 `Bridge ` 关键字，如下所示
Bridge <你的网桥>
Bridge <你的网桥>

HTTPSProxy 127.0.0.1:7890
```

重启电脑

```bash
sudo reboot
```

使用 torbrowser-launcher 安装浏览器

```bash
yay -S torbrowser-launcher
torbrowser-launcher
```

然后应该会自动开始下载 tor 浏览器

用这个命令之后就可以启动 tor 浏览器

浏览器需要初始设置:

在 tor 浏览器的设置里面:

settings -> connection(左侧第五个图标) ->(滚轮到最下面)Advanced -> Settings -> (点方框打对勾)`I use a proxy to access the Internet` -> (下拉菜单选择`Proxy type`)`HTTP/HTTPS` -> Address:`127.0.0.1` Port:`7890` -> `OK`

然后去上面`Bridges`里面填入你的网桥:
`Add new bridge` -> (粘贴你的网桥,只粘贴一个) -> `next` -> `OK`

最上面的`Tor Network`点击`Connect`
