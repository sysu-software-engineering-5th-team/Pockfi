# README

　　口袋智富 Pockfi

　　原始代码：

　　[ztkuaikuai/MiaoJi: 妙记✨记录你的生活。轻量记账小程序，在微信搜索妙记账单体验，使用uniapp与uniCloud进行开发。小程序毕设、毕业设计。](https://github.com/ztkuaikuai/MiaoJi)

### 部署参考：

　　妙记是基于 Vue2 的 Uniapp 和 Unicloud 制作的轻量记账应用。目前有微信小程序端和使用 uni-admin 搭建的后台管理 web 端。

　　*你可以通过 DeepWiki 生成的*​*[项目文档](https://deepwiki.com/ztkuaikuai/MiaoJi)*​*来详细了解该项目的结构和实现*。

#### 演示

![小程序二维码](https://webp.kuaikuaitz.top/%E5%B0%8F%E7%A8%8B%E5%BA%8F%E4%BA%8C%E7%BB%B4%E7%A0%81.jpg)

#### 快速启动⭐

#### 前提条件

1. 妙记通过 HBuilderX 进行开发，在微信开发者工具中预览效果。所以需要你先下载 [HBuilderX](https://hx.dcloud.net.cn/README) 和[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/devtools.html)。
2. 妙记使用 UniCloud 作为云开发平台（可以理解为服务端），需要你在 [UniCloud 控制台](https://unicloud.dcloud.net.cn/)注册登录并创建服务空间，免费的就行，以便后续开发使用。

#### 拷贝项目

　　fork 项目到你的仓库拷贝或者直接通过 `git clone`​ 命令拷贝[妙记](https://github.com/ztkuaikuai/MiaoJi)到本地，通过 HBuilderX 打开该项目。

#### 初始化项目

1. 右键 uniCloud 文件夹，关联你的云服务空间。
2. 创建 uni-id 配置文件。在 `/uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center`​ 下创建 `uni-id`​  
    文件夹，然后在 `uni-id`​ 文件夹中创建 `config.json`​ ，内容为下：

```json
// 配置项参考：https://doc.dcloud.net.cn/uniCloud/uni-id/summary.html#config
{
	"passwordSecret": [{
		"type": "hmac-sha256",
		"version": 1
	}],
	"passwordStrength": "medium",
	"tokenSecret": "这里写你的密钥，可以是无意义的字符串",
	"mp-weixin": {
		"tokenExpiresIn": 259200,
		"tokenExpiresThreshold": 86400,
		"oauth": {
            // 微信小程序登录所用的appid、appsecret需要在对应的小程序管理控制台获取
			"weixin": {
				"appid": "填写你小程序的appid",
				"appsecret": "填写你小程序的appsecret，注意一定不要泄露！"
			}
		}
	},
	"userRegisterDefaultRole": ["USER"]
}
```

3. 上传所有的云函数和数据库表。右键 uniCloud 文件夹中的   `cloudfunctions`​ ，点击「上传所有云函数、公共模块及 Actions」；右键 `database`​ ，点击「上传所有 DB Schema (含扩展)」。

    > 如果中途有弹窗，云函数点击「替换」，云数据库勾选「全部创建」后点「是」。
    >
4. 在 `manifest.json`​ 中更新你的配置。微信小程序配置，将 appid 替换成你自己小程序的 appid ；基础配置，将「uni-app 应用标识」重新获取，利用查找替换将项目中带有 `__UNI__EE89725`​ 的替换成你自己的。
5. 点击 HBuilder 顶部「运行-运行到小程序模拟器-微信开发者工具」运行项目~
6. 配置小程序合法域名，请[参考文档](https://doc.dcloud.net.cn/uniCloud/publish.html#useinmp)

　　‍

#### 项目结构

```js
uniCloud/               // 使用阿里云的云空间
  |-cloudfunctions/     // 存放云函数、云对象
  |-database/           // 存放数据库表结构，参考文档：https://siu9p6v1zlb.feishu.cn/docx/WvmfdEmzsoBCIhxUpN6cAw8Nn7b?from=from_copylink
.hbuilderx
components/             // 存放妙记的组件
pages/                  // 存放主要模块，即tabbar的4个页面，其余页面分包处理
pagesAccount/           // 记账模块
pagesFilter/            // 未开发完，筛选模块
pagesMy/                // 我的模块
static/                 // 静态资源，存放icon、图片等
uni_modules/            // 存放在插件市场下载的包
unpackage/
utils/                  // 存放可复用的工具函数
.gitignore
App.vue
CHANGELOG.md
index.html
LICENSE
main.js
manifest.json           // 应用的配置文件
pages.json              // 项目页面配置，相当于微信小程序当中的 app.json
README.md
uni.promisify.adaptor.js
uni.scss                // 全局的样式文件
```

　　‍

　　‍

### 待办清单：

1. 页面分类和基础交互

    - [X] 主页（记账）

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [X] 图表

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [X] 理财

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [ ] 提醒
    - [X] 我的

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [X] 登录

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    
2. 记账模块

    - [X] 手动添加消费记录

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [X] 编辑账目记录

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [ ] 手动编辑消费类型
    - [ ] 半**自动记录**消费
    - [ ] 反馈消费类型识别错误
    - [ ] 实时对照消费预算
    - [X] 资产模块（添加/删除/与消费记录绑定）

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [X] 同名资产合并

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    
3. 报表

    - [X] 消费/收入柱状图

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [X] 消费类型扇形图

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [ ] 生成消费分析报告
    
4. 理财

    - [X] 计算存款利息（存款计算器）

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [X] 查询股票数据（K线图）

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [ ] 对比股票收益率
    
5. 提醒

    - [ ] 月度预算（+提醒）
    - [ ] 财务目标设定
    
6. 我的

    - [X] 卡片展示

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    - [ ] 系统设置
    - [X] 自定义头像

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-24</div></div>
    - [X] 关于

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
    
7. 登录

    - [X] 正常登录

      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
      
      - 标准测试：
        - [x] 正常登录：输入正确账号、正确密码，客户端正确提示“登陆成功”
      - 边界测试：
      
        - [x] 密码错误：输入错误密码，客户端正确提示“密码错误”
        - [x] 账号错误：输入错误账号，客户端正确提示“此账号未注册”
        - [x] 不同意用户服务协议：客户端正确提示并可以选择同意或取消
      
      - 改进建议(可选)：
      
        - [ ] 其他登录方式
      
          
      
    - [ ] 注册账号（目前可通过账密注册）
    
      - 标准测试：
        - [x] 账密注册：成功注册并载入数据库
    
      - 边界测试：
    
        - [ ] 重复注册：在后台有报错，但是客户端无显示
        
          <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">发现时间: 2025-05-26</div></div>
        
        - [x] 超长用户名：客户端正确提示
        
        - [x] 超长昵称：客户端正确提示
        
        - [x] 超长密码：客户端正确限制超额输入
        
        - [x] 不同意用户服务协议：客户端正确提示并可以选择同意或取消
        
      - 改进建议(可选)：
    
        - [ ] 其他注册方式
    
        - [ ] 超长密码：客户端正确限制超额输入，同时给出提示
    
          
    
    - [ ] 忘记密码（已有页面模板但未实现验证手机号码）
    
      
    
    - [X] 隐私政策
    
      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
      
      - 标准测试：
      
        - [x] 隐私政策条款：客户端正确点击进入详情，正确点击返回
      
        - [x] 点击勾选：客户端正确点击勾选，再次点击取消
      
          
      
    - [X] 软件条约
    
      <div class="siyuan-plugin-task-date-info-wrapper" contenteditable="false" data-type="siyuan-plugin-custom-wrapper" style="position: absolute; top: 0px; right: 0px; left: 0px; pointer-events: none !important;"><div class="siyuan-plugin-task-date-info" contenteditable="true" data-editable="false" spellcheck="false" data-type="siyuan-plugin-custom-date-info" style="position: absolute; font-size: 10px; color: rgb(136, 136, 136); text-align: right; right: 20px; top: -12px; pointer-events: none !important; user-select: none !important;">完成时间: 2025-05-23</div></div>
      
      - 标准测试：
      
        - [x] 软件条约：客户端正确点击进入详情，正确点击返回
      
        - [x] 点击勾选：客户端正确点击勾选，再次点击取消
      
          
      
    - [ ] 快捷登录（已有页面模板）
    
8. 管理员

    - [ ] 发布更新
    - [ ] 发布通知
    - [ ] 封禁异常用户
    - [ ] 编辑帮助文档
    - [ ] 数据看板
