# WeixinKCal 云托管后端

这是给微信云托管 Go 服务使用的后端。服务监听 `:80`，通过 `wx.cloud.Cloud({ resourceEnv }).callContainer` 调用。

## 云托管配置

小程序端配置：

- `resourceEnv`: `prod-d8ghbq8xea378972b`
- `X-WX-SERVICE`: `golang-24re-001`

服务端环境变量：

- `MYSQL_ADDRESS`: MySQL 内网地址，格式如 `host:port`
- `MYSQL_USERNAME`: MySQL 用户名
- `MYSQL_PASSWORD`: MySQL 密码
- `MYSQL_DATABASE`: 数据库名，可选，默认 `weixinkcal`
- `PORT`: 监听端口，可选，默认 `80`

不要把数据库密码写进仓库。

## API

- `GET /healthz`: 健康检查。
- `POST /api/account`: 同步本地账户，返回云端账户状态。
- `POST /api/profile`: 保存身体档案。
- `POST /api/profile/get`: 读取身体档案。
- `POST /api/meals`: 保存餐食记录。
- `POST /api/meals/list`: 按日期读取餐食和日汇总。

所有接口返回：

```json
{
  "code": 0,
  "data": {}
}
```
