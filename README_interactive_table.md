# 词语规则可视化表格 - 交互版

这个项目提供了一个交互式的词语规则可视化表格，允许你点击单元格来切换 True/False 值，并将更改保存到对应的 JSON 文件中。

## 功能特性

- **交互式编辑**: 点击任何单元格可以切换 True/False 值
- **视觉反馈**: 修改的单元格会有红色边框和脉冲动画
- **实时统计**: 显示已修改的单元格数量
- **保存功能**: 将更改保存到对应的 word_x.json 文件
- **导出功能**: 可以导出为 CSV 文件
- **状态提示**: 保存操作的状态反馈

## 安装和运行

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 启动服务器

```bash
python server.py
```

服务器将在 `http://localhost:5000` 启动。

### 3. 访问交互式表格

在浏览器中打开 `http://localhost:5000` 即可看到交互式表格。

## 使用方法

### 基本操作

1. **点击单元格**: 点击任何数据单元格可以切换 True/False 值
2. **查看修改**: 修改的单元格会有红色边框和脉冲动画
3. **保存更改**: 点击"保存更改"按钮将修改保存到 JSON 文件
4. **导出数据**: 点击"导出为CSV"按钮可以导出表格数据

### 文件结构

- `server.py` - Python Flask 服务器
- `interactive_table.html` - 交互式表格页面
- `word_rules_table.html` - 原始表格页面（用于数据提取）
- `src/resources/data/words_zh/` - 词语 JSON 文件目录

### API 端点

- `GET /` - 显示交互式表格
- `GET /word_rules_table.html` - 获取原始表格
- `GET /src/resources/data/words_zh/<filename>` - 获取词语 JSON 文件
- `POST /api/save-word/<word_id>` - 保存词语 JSON 文件
- `GET /api/words` - 列出所有词语文件

## 技术实现

### 前端

- **HTML5/CSS3**: 表格布局和样式
- **JavaScript**: 交互逻辑和数据处理
- **Fetch API**: 与后端 API 通信

### 后端

- **Flask**: Python Web 框架
- **Flask-CORS**: 跨域资源共享支持
- **JSON 处理**: 读取和写入 JSON 文件

### 数据流程

1. 加载原始 HTML 表格并解析数据
2. 加载所有 word_x.json 文件
3. 渲染交互式表格
4. 用户点击单元格时更新内存中的数据
5. 点击保存时将修改的数据写回 JSON 文件

## 注意事项

- 确保 `src/resources/data/words_zh/` 目录存在且包含 word_x.json 文件
- 服务器需要有写入权限来保存 JSON 文件
- 建议在修改前备份原始 JSON 文件

## 故障排除

### 常见问题

1. **无法加载表格**: 检查 `word_rules_table.html` 文件是否存在
2. **无法保存文件**: 检查文件权限和目录结构
3. **服务器启动失败**: 检查端口是否被占用，可以修改 `server.py` 中的 `PORT` 变量

### 调试

- 查看浏览器控制台的错误信息
- 查看服务器日志输出
- 检查网络请求的状态码

## 扩展功能

可以考虑添加的功能：

- 批量编辑功能
- 撤销/重做功能
- 搜索和过滤功能
- 数据验证和冲突检测
- 用户权限管理
- 数据备份和恢复 