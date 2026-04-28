# 小潮瓜子 - 网站部署说明

## 一、部署环境要求

### 服务器要求
- 操作系统：Linux（推荐Ubuntu 18.04及以上版本）
- Web服务器：Nginx 1.14及以上版本
- 网络：确保服务器有公网IP地址
- 端口：80（HTTP）和443（HTTPS，可选）端口已开放

### 本地环境要求
- FTP/SFTP客户端（如FileZilla、WinSCP）用于上传文件
- 域名管理权限（如需要绑定域名）

## 二、部署步骤

### 1. 服务器环境检查

首先确认服务器上已安装并运行Nginx：

```bash
# 检查Nginx是否安装
nginx -v

# 检查Nginx服务状态
systemctl status nginx
```

如果Nginx未安装，请使用以下命令安装：

```bash
# Ubuntu/Debian系统
apt update
apt install nginx

# CentOS/RHEL系统
yum install nginx
```

启动并设置Nginx开机自启：

```bash
systemctl start nginx
systemctl enable nginx
```

### 2. 上传网站文件

#### 方法一：使用SFTP客户端上传

1. 打开SFTP客户端（如FileZilla、WinSCP）
2. 连接到服务器（使用服务器IP、用户名和密码）
3. 进入服务器上的Nginx网站根目录：`/usr/share/nginx/html/`
4. 将本地项目文件夹中的所有文件（不包括项目文件夹本身）上传到该目录

#### 方法二：使用scp命令上传

在本地命令行中执行：

```bash
# 将本地项目文件夹中的所有文件上传到服务器
scp -r /本地项目路径/* username@服务器IP:/usr/share/nginx/html/
```

### 3. 检查文件权限

确保上传的文件具有正确的权限：

```bash
# 设置文件所有者为nginx用户
chown -R nginx:nginx /usr/share/nginx/html/

# 设置文件权限
chmod -R 755 /usr/share/nginx/html/
```

### 4. Nginx配置（可选）

默认情况下，Nginx已经配置好了默认网站，指向`/usr/share/nginx/html/`目录。如果需要自定义配置，可以编辑Nginx配置文件：

```bash
# 编辑默认配置文件
nano /etc/nginx/conf.d/default.conf
```

基本配置示例：

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

保存配置文件后，重新加载Nginx：

```bash
nginx -t  # 测试配置文件是否正确
nginx -s reload  # 重新加载配置
```

### 5. 绑定域名（可选）

如果您有域名，需要将域名解析到服务器IP地址：

1. 登录您的域名注册商管理后台
2. 添加A记录，将域名指向服务器的公网IP地址
3. 等待DNS解析生效（通常需要几分钟到几小时）

然后修改Nginx配置文件，将`server_name`设置为您的域名：

```nginx
server {
    listen 80;
    server_name www.xiaochao-guazi.com xiaochao-guazi.com;
    # 其他配置...
}
```

重新加载Nginx配置：

```bash
nginx -t
nginx -s reload
```

### 6. 配置HTTPS（可选）

如果需要启用HTTPS，可以使用Let's Encrypt免费SSL证书：

```bash
# 安装Certbot
apt install certbot python3-certbot-nginx

# 获取SSL证书
certbot --nginx -d www.xiaochao-guazi.com -d xiaochao-guazi.com
```

按照提示完成配置，Certbot会自动更新Nginx配置并重启服务。

## 三、访问测试

完成部署后，通过以下方式测试网站是否正常访问：

### 1. 通过IP地址访问

在浏览器中输入服务器的公网IP地址，如：`http://123.45.67.89`

### 2. 通过域名访问（如果已绑定域名）

在浏览器中输入您的域名，如：`http://www.xiaochao-guazi.com`

### 3. 检查页面功能

确保以下功能正常工作：
- 导航栏链接跳转正常
- 轮播图自动播放和手动切换功能
- 产品展示页轮播图功能
- 图片加载正常
- 响应式布局（在不同设备上测试）

## 四、常见问题排查

### 1. 网站无法访问

- 检查服务器是否启动
- 检查Nginx服务是否运行
- 检查服务器防火墙是否开放80/443端口
- 检查域名解析是否正确

### 2. 页面显示404错误

- 检查文件路径是否正确
- 检查文件是否上传完整
- 检查Nginx配置中的root目录是否正确

### 3. 图片无法显示

- 检查图片文件是否上传完整
- 检查图片路径是否正确
- 检查图片文件名是否与代码中的配置一致

### 4. 页面样式错乱

- 检查CSS文件是否上传完整
- 检查CSS文件路径是否正确

### 5. JavaScript功能不工作

- 检查JavaScript文件是否上传完整
- 检查JavaScript文件路径是否正确
- 打开浏览器开发者工具，查看控制台是否有错误信息

## 五、维护与更新

### 更新网站内容

1. 在本地修改网站文件
2. 使用SFTP或scp命令将修改后的文件上传到服务器，覆盖原有文件
3. 清除浏览器缓存，重新访问网站查看更新效果

### 更新图片

1. 根据图片填充指南，将新图片命名并放入对应的文件夹
2. 上传图片到服务器对应的目录
3. 如果修改了图片文件名或数量，需要更新`js/script.js`文件中的图片路径配置

### 备份网站

定期备份网站文件，防止数据丢失：

```bash
# 创建备份文件夹
mkdir -p /backup/website

# 备份网站文件
tar -czvf /backup/website/$(date +%Y%m%d)_xiaochao-guazi.tar.gz /usr/share/nginx/html/
```

## 六、技术支持

如果在部署过程中遇到问题，可以：
1. 查看Nginx日志文件：`/var/log/nginx/error.log`
2. 检查浏览器开发者工具中的错误信息
3. 联系专业技术人员协助解决

---

部署完成后，您的小潮瓜子品牌网站就可以正常访问了！祝您生意兴隆！