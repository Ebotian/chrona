---
date: 2025-10-29
---

从前的桌面shell太过臃肿了，现在换一个简洁的桌面shell吧！


项目地址:https://docs.noctalia.dev/getting-started/installation/

首先安装hyprland,然后执行这个:

```bash
yay -S noctalia-shell
```

是的,一行就足够啦!

然后进行配置,这个shell相当简洁,但是同时保留了高度的可配置性,这里是我的`hyprland.conf`

可能需要去`ctrl+alt+F2`去把terminal打开,然后编辑`~/.config/hypr/hyprland.conf`把命令行快捷方式先打开:
`bind = SUPER, T, exec, kitty`(这里使用kitty命令行)

```ini
# Noctalia Shell 集成绑定
exec-once = qs -c noctalia-shell
exec-once = fcitx5
exec-once = wl-paste --watch cliphist store
monitor = eDP-1,1920x1080@60,0x0,1

bind = SUPER, SPACE, exec, qs -c noctalia-shell ipc call launcher toggle
bind = SUPER, S, exec, qs -c noctalia-shell ipc call controlCenter toggle
bind = SUPER, comma, exec, qs -c noctalia-shell ipc call settings toggle
bindel = , XF86AudioRaiseVolume, exec, qs -c noctalia-shell ipc call volume increase
bindel = , XF86AudioLowerVolume, exec, qs -c noctalia-shell ipc call volume decrease
bindl = , XF86AudioMute, exec, qs -c noctalia-shell ipc call volume muteOutput
bindel = , XF86MonBrightnessUp, exec, qs -c noctalia-shell ipc call brightness increase
bindel = , XF86MonBrightnessDown, exec, qs -c noctalia-shell ipc call brightness decrease

bind = SUPER, L, exec, qs -c noctalia-shell ipc call lockScreen toggle
# 鼠标绑定 - 窗口拖拽和调整
bindm = SUPER, mouse:272, movewindow
bindm = SUPER, mouse:273, resizewindow

# 键盘窗口移动
bind = SUPER SHIFT, left, movewindow, l
bind = SUPER SHIFT, right, movewindow, r
bind = SUPER SHIFT, up, movewindow, u
bind = SUPER SHIFT, down, movewindow, d

# 键盘窗口调整
bind = SUPER CTRL, left, resizeactive, -20 0
bind = SUPER CTRL, right, resizeactive, 20 0
bind = SUPER CTRL, up, resizeactive, 0 -20
bind = SUPER CTRL, down, resizeactive, 0 20

# 精确窗口调整
bind = SUPER ALT, left, resizeactive, -10 0
bind = SUPER ALT, right, resizeactive, 10 0
bind = SUPER ALT, up, resizeactive, 0 -10
bind = SUPER ALT, down, resizeactive, 0 10

# 工作区切换
bind = SUPER, 1, workspace, 1
bind = SUPER, 2, workspace, 2
bind = SUPER, 3, workspace, 3
bind = SUPER, 4, workspace, 4
bind = SUPER, 5, workspace, 5
bind = SUPER, 6, workspace, 6
bind = SUPER, 7, workspace, 7
bind = SUPER, 8, workspace, 8
bind = SUPER, 9, workspace, 9
bind = SUPER, 0, workspace, 10

# 按住 Super 键 + 滚轮向上：切换到上一个工作区
bind = SUPER, mouse_up, workspace, +1

# 按住 Super 键 + 滚轮向下：切换到下一个工作区
bind = SUPER, mouse_down, workspace, -1

# 移动窗口到工作区
bind = SUPER SHIFT, 1, movetoworkspace, 1
bind = SUPER SHIFT, 2, movetoworkspace, 2
bind = SUPER SHIFT, 3, movetoworkspace, 3
bind = SUPER SHIFT, 4, movetoworkspace, 4
bind = SUPER SHIFT, 5, movetoworkspace, 5
bind = SUPER SHIFT, 6, movetoworkspace, 6
bind = SUPER SHIFT, 7, movetoworkspace, 7
bind = SUPER SHIFT, 8, movetoworkspace, 8
bind = SUPER SHIFT, 9, movetoworkspace, 9
bind = SUPER SHIFT, 0, movetoworkspace, 10

bind = SUPER, Q, killactive

#窗口设置

# 全屏配置
# Super + F - 普通全屏（占用整个屏幕）
bind = SUPER, F, fullscreen, 0


general {
    gaps_in = 0
    gaps_out = 0
    col.active_border = rgba(888888ff) rgba(aaaaaaff) 45deg
}

decoration {
    rounding = 0
}

# 特殊工作区
bind = SUPER, minus, movetoworkspace, special
bind = SUPER, equal, togglespecialworkspace

# 启动应用
bind = SUPER, T, exec, kitty
bind = SUPER, W, exec, firefox
bind = SUPER, P, exec, wechat
bind = SUPER, C, exec, code --enable-features=UseOzonePlatform --ozone-platform=wayland
bind = SUPER, V, exec, cliphist list | wofi --dmenu --insensitive | cliphist decode | wl-copy

# 截图：Shift + Super + S — 打开 swappy 预览，可复制或保存
# 使用 grim + slurp 管道给 swappy，提供复制/保存等选项
bind = SUPER SHIFT, S, exec, bash -lc 'grim -g "$(slurp)" - | swappy -f -'
```