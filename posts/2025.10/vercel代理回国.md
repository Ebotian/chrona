---
date: 2025-10-27
---

### vercel代理回国的过程:

1. 在国内域名服务商处购买域名并实名认证,比如这次我用的是aliyun的域名服务.
2. 在cloudflare上添加域名并进行DNS解析设置,等待解析完成.
3. 在cloudflare上设置https-only,并且将安全模式设置为中等/严格.
4. 在vercel的domain设置中添加刚才购买的域名,按照步骤连接到cloudflare的nameserver

> 注意:有时候本地代理环境(rules)下可能无法访问cloudflare的某些页面(因为没有配置网站代理相应规则),

>可以尝试切换到普通网络环境下进行设置.或者切换为直连模式/direct进行测试.