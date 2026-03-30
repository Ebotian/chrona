---
date: 2025-01-15
---

时间是 2025 年 1 月 15 日,我在这里写下了这篇文章.目的是叙述如何在一台 windows 主机上安装和配置能够在中国大陆地区使用的漂亮的 Arch Linux.

前提条件/需要：

- 一台 windows 主机
- 一个 U 盘>=8G
- 可用(未分配)的硬盘空间最好大于 50G(可以在 windows 上通过压缩卷完成这一准备,我这里使用 200G,并为这个空间格式化为了`ntfs`方便之后找(optional))
- 一个可用的网络连接（我使用无线网络）
- 机场的订阅链接(clash for windows 的链接就可以)
- 高中英语水平
- 一点耐心
- 非蓝牙键盘
- 任意人工智能访问

如果你能看得懂文档: [Arch Linux 安装指南](https://wiki.archlinux.org/title/Installation_guide)那你最好先去看和跟着做.这篇文章只是记录我自己的安装,配置和一些自定义操作.我是根据以上文档来做的.

1. 参考这里[下载 archlinux](https://archlinux.org/download/)如果你懒得看可以直接点击这里下载阿里云镜像 2025.01.01 版本的[archlinux](https://mirrors.aliyun.com/archlinux/iso/2025.01.01/archlinux-2025.01.01-x86_64.iso)
2. 烧录到 U 盘:为了避免你找到付费工具,我用的是这个:[U 盘烧录工具](https://sourceforge.net/projects/usbwriter/),当然还有成千上万的免费烧录工具,下载之后你会得到一个压缩包,解压后得到烧录软件和使用说明,如果你看不懂说明可以让 GPT 给你解释
3. 然后需要禁用你电脑的"UEFI 安全启动"选项,以便我们能从 U 盘启动系统,具体方法可以根据你的电脑型号搜索
4. 重启电脑,按照提示进入 BIOS(根据不同型号,一般需要在开机时迅速连续按一个键,我这里是`F12`),选择从 U 盘启动(一般来说,就是不是 WINDOWS 的那个选项,当然你也可以通过 U 盘型号确定这个选择),进入 Arch Linux 安装界面
5. 当引导加载程序菜单出现时,如果你使用了 ISO 映像,选择 `Arch Linux install medium`并按`Enter`进入安装环境。键盘输入`ip link`之后应该有类似于下面的输出:
   ![iplink](/2025.1/iplink.jpg)
6. 以上过程成功说明你的键盘输入 OK,网络连接硬件条件 OK.你可以休息一下.**注意接下来的命令大多有按`tag`键补全或者提示的功能,在我们输入长命令时很有用.键盘有方向键可以按上箭头和下箭头寻找历史命令,左右箭头移动输入光标,这对输入重复和相似命令很有用.**
7. 接下来我连接无线网:输入`iwctl`进入新的交互界面,输入`device list`:![devicelist](/2025.1/devicelist.jpg)可以看到我的网卡可能默认被关闭了,现在要重新打开.输入`quit`退出 iwctl,输入 rfkill 检查:![rfkill](/2025.1/rfkill.jpg)看到 block,说明网卡被禁用了,输入`rfkill unblock wifi`解除禁用,再次输入`iwctl`进入交互界面,这里我的网卡是`wlan0`,接下来的命令我以的这个网卡名字为例.输入`device [name] set-property Powered on`打开网卡,输入`station wlan0 scan`扫描附近的无线网络,输入`station wlan0 get-networks`找到你的网络名,输入`station wlan0 connect [networkname]`连接网络,输入密码,连接成功后使用`quit`退出.至此基本网络连接完毕.可以通过在终端输入`ping baidu.com`来测试网络连接(有不断的输出就是成功了,通过`ctrl+c`可以中止命令).
8. 进行磁盘分区:**若你没有磁盘分区熟练经验,建议对欲操作的硬盘全盘所有数据进行备份**输入`fdisk -l`查看磁盘信息,找到你要安装的磁盘,我这里是`/dev/nvme0n1`(一块固态硬盘),输入`fdisk /dev/nvme0n1`准备对此硬盘分区.由于我事先将准备装系统的空间格式化为了`ntfs`,在这里是可以看见有 200G 的对应空间`/dev/nvme0n1p4`(注意这个`4`).我准备在这 200G 中分 3 个空间,分别用于启动工具`grub`,扩展内存`swap`和系统所在.下面介绍流程:**以下所说的`默认`指不输入任何东西直接按`enter`一行所写的输入结束后要按`enter`**

- 输入 `p` 查看当前分区表，看到有 `/dev/nvme0n1p4`。
- 输入 `d` 删除分区：
- 系统会提示输入分区号，输入 `4`（对应 `/dev/nvme0n1p4`）。
- 输入 `p` 查看分区表，确认 `/dev/nvme0n1p4` 已删除(看不见了)，空间变为未分配。
- 创建 GRUB 分区（512MB）
  - 输入 `n` 创建新分区。
  - 按提示选择分区类型(系统会依次提示你输入)：
  - 分区号默认
  - 起始扇区默认。
  - 终止扇区输入 `+512M`（创建 512MB 的分区）。
- 设置分区类型为 EFI System：
  - 输入 `t` 修改分区类型。
  - 输入分区号（这里是,对应之前删除的分区号 `4`）。
  - 输入 `1`（对应 EFI System 类型）。
- 创建 Swap 分区（8GB）
  - 输入 `n` 创建新分区。
  - 按提示选择分区类型：
  - 分区号默认。
  - 起始扇区默认。
  - 终止扇区输入 `+8G`（创建 8GB 的分区）。
- 设置分区类型为 Linux Swap：
  - 输入 `t` 修改分区类型。
  - 输入分区号（这里是,对应之前删除的`分区号+1`=`5`）。
  - 输入 `19`（对应 Linux Swap 类型）。
- 创建系统分区（剩余空间）
  - 输入 `n` 创建新分区。
  - 按提示选择分区类型：
  - 分区号默认。
  - 起始扇区默认。
  - 终止扇区默认（使用剩余空间）。
- 输入 `w` 写入分区表。
  至此你的磁盘已经分配完毕,可以通过`p`查看分区表,确认分区已创建.

9. 格式化分区:输入`mkfs.fat -F32 /dev/nvme0n1p4`格式化 EFI 分区,输入`mkswap /dev/nvme0n1p5`格式化 swap 分区,输入`swapon /dev/nvme0n1p5`启用 swap 分区,输入`mkfs.ext4 /dev/nvme0n1p6`格式化系统分区.
10. 挂载分区:输入`mount /dev/nvme0n1p6 /mnt`挂载系统分区,输入`mkdir /mnt/boot`创建 boot 目录,输入`mount /dev/nvme0n1p4 /mnt/boot`挂载 EFI 分区.
11. 安装基本系统:输入`pacstrap /mnt base linux linux-firmware vim networkmanager`安装基本系统和内核.安装完成后，生成并写入分区挂载信息：`genfstab -U /mnt >> /mnt/etc/fstab`.至此我们的新系统已经可以使用.接下来都是美化和配置操作.
12. 进入新系统:输入`arch-chroot /mnt`进入新系统

- 设置时区:输入`ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime`输入`timedatectl set-timezone Asia/Shanghai`输入`timedatectl set-ntp true`
- 设置硬件时间:输入`hwclock --systohc`
- 设置语言(这里需要你学习 vim 的基本使用方法,增删查改):输入`vim /etc/locale.gen`找到`en_US.UTF-8 UTF-8`和`zh_CN.UTF-8 UTF-8`取消注释,保存退出,输入`locale-gen`
- 设置主机名输入`echo arch > /etc/hostname`
- 设置 root 密码:输入`passwd`输入两次密码(所有密码输入会保持不可见,输完按`enter`就可以,建议先设置一个简单的纯数字密码,之后可以在命令行用相同的方式修改)

13. 联网:启用并启动 `NetworkManager` 服务：

```bash
systemctl enable NetworkManager
systemctl start NetworkManager
nmtui
```

通过 tui 图形界面配置网络(方向键和 enter).

14. 创建用户:输入`useradd -m -G wheel -s /bin/bash [username]`输入`passwd [username]`输入两次密码,输入`EDITOR=vim visudo`找到`# %wheel ALL=(ALL) ALL`取消注释号`#`,保存退出这里的`[username]`是你的用户名

15. 安装 grub:输入`pacman -S grub efibootmgr`安装 grub 和 efibootmgr,输入`grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=GRUB`安装 grub,输入`grub-mkconfig -o /boot/grub/grub.cfg`生成 grub 配置文件

16. 重启:输入`exit`退出 chroot,输入`umount -R /mnt`卸载分区,输入`reboot`重启,拔掉 U 盘,进入 grub 启动界面,选择 Arch Linux 启动,进入系统.此时你有两个用户,一个是 root,一个是你刚刚创建的用户,应该用输入你的用户名(不是 root),输入密码,登录成功.

17. 安装 clash 并配置:输入`sudo pacman -S clash`安装 clash

配置:

```bash
cd
curl -o config.yaml "你的订阅链接(是的,手动打)"
mkdir -p /etc/clash
sudo mv config.yaml /etc/clash
sudo vim /etc/systemd/
```

设置自动启动:

```bash
sudo vim /etc/systemd/system/clash.service
```

填入以下内容:

```bash
[Unit]
Description=Clash <^-^>
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/clash -d /etc/clash
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

设置转发:

```bash
sudo vim /etc/environment
```

输入这些:

```bash
XDG_SESSION_TYPE=wayland
XDG_CURRENT_DESKTOP=Hyprland

http_proxy="http://127.0.0.1:7890"
https_proxy="http://127.0.0.1:7890"
```

加载配置:

```bash
sudo systemctl daemon-reload
sudo systemctl enable clash
sudo systemctl start clash
```

使用以下命令测试网络:

```bash
 curl -I  https://youtube.com/
```

如果第一行是`HTTP/1.1 200 Connection established`说明代理成功

18. 安装桌面环境

```bash
sudo pacman -Syu
sudo pacman -S --needed base-devel git
git clone https://aur.archlinux.org/yay.git
cd yay
makepkg -si
rm -rf yaygtksourceviewmm
bash <(curl -s "https://end-4.github.io/dots-hyprland-wiki/setup.sh")
```

自行选择和设置过程就好,注意安装过程需要多次输入密码

19. 安装过程可能会出现和`gtksourceviewmm-3.0`有关的错误,找不到这个包,可以通过`yay -S gtksourceviewmm`安装
    首先运行

```bash
sudo pacman -S downgrade
sudo downgrade gtksourceviewmm
```

输入`3.18`对应版本之前的数字,然后`enter`确认安装
`downgrade` 会询问是否将软件包添加到 `IgnorePkg` 列表中。选择 `Yes` 即可防止后续更新。
然后运行

```bash
sudo chattr +i /usr/lib/gtksourceviewmm*
sudo chattr +i /usr/include/gtksourceviewmm*
```

然后重新运行

```bash
bash <(curl -s "https://end-4.github.io/dots-hyprland-wiki/setup.sh")
```

20. 安装显卡驱动(这里只给出 nvidia 的例子,我的是 NVIDIA GeForce GTX 1650 Mobile / Max-Q )

````md
### **步骤 1：启用 NVIDIA DRM KMS**

### **安装 NVIDIA 驱动**

1. 确保系统是最新的：

   ```bash
   sudo pacman -Syu
   ```

2. 安装 NVIDIA 驱动和相关工具：

   ```bash
   sudo pacman -S nvidia nvidia-utils nvidia-settings
   ```

3. 安装支持 Wayland 的 GBM 库：

   ```bash
   sudo pacman -S libglvnd
   ```

4. （可选）安装 Vulkan 支持（提高图形性能）：

   ```bash
   sudo pacman -S vulkan-icd-loader nvidia-utils
   ```

5. 确保内核模块已加载：

   ```bash
   sudo modprobe nvidia
   ```

6. 验证驱动是否正确安装：
   ```bash
   nvidia-smi
   ```

---

## **2. 配置 NVIDIA 驱动以支持 Wayland**

从 NVIDIA 495 驱动版本开始，支持 Wayland 的 GBM 后端。以下是配置步骤：

### **步骤 1：启用 NVIDIA DRM KMS**

需要启用 DRM KMS（Direct Rendering Manager Kernel Mode Setting）以支持 Wayland。

1. 编辑 `/etc/default/grub` 文件：

   ```bash
   sudo vim /etc/default/grub
   ```

2. 修改成以下内容

```bash
# GRUB boot loader configuration
GRUB_DEFAULT=0
GRUB_TIMEOUT=0
GRUB_DISTRIBUTOR="Arch"
GRUB_CMDLINE_LINUX_DEFAULT="loglevel=3 quiet nvidia-drm.modeset=1"
GRUB_CMDLINE_LINUX=""

# Preload both GPT and MBR modules so that they are not missed
GRUB_PRELOAD_MODULES="part_gpt part_msdos"

# Uncomment to enable booting from LUKS encrypted devices
#GRUB_ENABLE_CRYPTODISK=y

# Set to 'countdown' or 'hidden' to change timeout behavior,
# press ESC key to display menu.
GRUB_TIMEOUT_STYLE=hidden

# Uncomment to use basic console
GRUB_TERMINAL_INPUT=console

# Uncomment to disable graphical terminal
#GRUB_TERMINAL_OUTPUT=console

# The resolution used on graphical terminal
# note that you can use only modes which your graphic card supports via VBE
# you can see them in real GRUB with the command `videoinfo`
#GRUB_GFXMODE=auto

# Uncomment to allow the kernel use the same resolution used by grub
GRUB_GFXPAYLOAD_LINUX=keep

#  Uncomment if you want GRUB to pass to the Linux kernel the old parameter
# format "root=/dev/xxx" instead of "root=/dev/disk/by-uuid/xxx"
#GRUB_DISABLE_LINUX_UUID=true

# Uncomment to disable generation of recovery mode menu entries
GRUB_DISABLE_RECOVERY=true

# Uncomment and set to the desired menu colors.  Used by normal and wallpaper
# modes only.  Entries specified as foreground/background.
#GRUB_COLOR_NORMAL="light-blue/black"
#GRUB_COLOR_HIGHLIGHT="light-cyan/blue"

# Uncomment one of them for the gfx desired, a  image background or a gfxtheme
#GRUB_BACKGROUND="/path/to/wallpaper"
#GRUB_THEME="/path/to/gfxtheme"

# Uncomment to get a beep at GRUB start
#GRUB_INIT_TUNE="480 440 1"

# Uncomment to make GRUB remember the last selection. This requires
# setting 'GRUB_DEFAULT=saved' above.
#GRUB_SAVEDEFAULT=true

# Uncomment to disable submenus in boot menu
#GRUB_DISABLE_SUBMENU=y

# Probing for other operating systems is disabled for security reasons. Read
# documentation on GRUB_DISABLE_OS_PROBER, if still want to enable this
# functionality install os-prober and uncomment to detect and include other
# operating systems.
#GRUB_DISABLE_OS_PROBER=false
```

3. 更新 GRUB 配置：

   ```bash
   sudo grub-mkconfig -o /boot/grub/grub.cfg
   ```

4. 创建配置文件 `/etc/modprobe.d/nvidia.conf`，并添加以下内容：

   ```
   options nvidia-drm modeset=1
   ```

5. 更新 initramfs：

   ```bash
   sudo mkinitcpio -P
   ```

6. 重启系统：
   ```bash
   sudo reboot
   ```

### **步骤 2：验证 NVIDIA DRM KMS 是否启用**

运行以下命令，确保 `nvidia-drm` 已启用：

```bash
sudo dmesg | grep -i nvidia
```

你应该看到类似以下输出：

```
nvidia-modeset: Loading NVIDIA Kernel Mode Setting Driver
nvidia-drm: NVIDIA DRM KMS initialized
```
````

21. 解决`hyprland threw in ctor:filesystem error status permission denied /run/user/0/hypr`

```bash
export XDG_RUNTIME_DIR=/run/user/$(id -u)
sudo mkdir -p /run/user/$(id -u)
sudo chown $(id -u):$(id -g) /run/user/$(id -u)
chmod 700 /run/user/$(id -u)
```

22. 重启,启动桌面:

```bash
sudo reboot
cp -r .cache/dots-hyprland/.config/ ~/.config
cp -r .cache/dots-hyprland/.local/ ~/.local
hyprland
```

这里是[使用说明](https://end-4.github.io/dots-hyprland-wiki/zh-cn/i-i/02usage/)
键盘绑定在`.config/hypr/hyprland/keybinds.conf`中,可以自行修改

23. 输入法配置(yay):

`yay -S firefox noto-fonts-cjk fcitx5 fcitx5-chinese-addons fcitx5-pinyin-zhwiki fcitx5-qt fcitx5-gtk fcitx5-material-color fcitx5-configtool`

然后用`fcitx5-configtool`配置输入法,添加`Pinyin`输入法,然后在`hyprland`中设置`fcitx5`为输入法,重启后即可使用中文输入法

24. 下点自己想下的东西,比如微信,qq,vscode 等等
