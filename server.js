const express = require('express');
const { Vika } = require('@vikadata/vika');
const cors = require('cors');

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // 提供静态文件服务

// 初始化 Vika SDK
const vika = new Vika({ 
    token: "uskFocCBUtljNHeAX5AOhRU", 
    fieldKey: "name" 
});

// 指定数据表
const datasheet = vika.datasheet("dstouAM0RMpGKD3STi");

// 查询所有图书接口
app.get('/api/books', async (req, res) => {
    try {
        const response = await datasheet.records.query({ 
            viewId: "viwHrFyrUrVXC"
        });
        
        if (response.success) {
            res.json(response.data);
        } else {
            res.status(500).json({ error: '获取图书列表失败' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: '服务器错误' });
    }
});

// 新增图书接口
app.post('/api/books', async (req, res) => {
    try {
        const { fields } = req.body;
        
        // 验证必填字段
        if (!fields.book_name || !fields.book_id || !fields.book_statue || !fields.book_location) {
            return res.status(400).json({ 
                success: false, 
                message: '请填写所有必填字段' 
            });
        }

        // 检查图书ID是否已存在
        const existingBooks = await datasheet.records.query({
            filterByFormula: `{book_id} = ${fields.book_id}`
        });

        if (existingBooks.data.records.length > 0) {
            return res.status(400).json({
                success: false,
                message: '该图书ID已存在'
            });
        }

        // 创建新记录
        const response = await datasheet.records.create([{
            fields: {
                book_name: fields.book_name,
                book_id: fields.book_id.toString(),
                book_statue: fields.book_statue,
                book_location: fields.book_location
            }
        }]);

        if (response.success) {
            res.json({
                code: 200,
                success: true,
                message: 'Request successful',
                data: {
                    records: response.data.records
                }
            });
        } else {
            res.status(500).json({
                code: 500,
                success: false,
                message: '添加图书失败'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            code: 500,
            success: false,
            message: '服务器错误'
        });
    }
});

// 更新图书接口
app.put('/api/books/:recordId', async (req, res) => {
    try {
        const { recordId } = req.params;
        const { fields } = req.body;

        // 验证必填字段
        if (!fields.book_name || !fields.book_id || !fields.book_statue || !fields.book_location) {
            return res.status(400).json({
                code: 400,
                success: false,
                message: '请填写所有必填字段'
            });
        }

        // 更新记录
        const response = await datasheet.records.update([{
            recordId: recordId,
            fields: {
                book_name: fields.book_name,
                book_id: fields.book_id.toString(),
                book_statue: fields.book_statue,
                book_location: fields.book_location
            }
        }]);

        if (response.success) {
            res.json({
                code: 200,
                success: true,
                message: 'Request successful',
                data: {
                    records: response.data.records
                }
            });
        } else {
            res.status(500).json({
                code: 500,
                success: false,
                message: '更新图书失败'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({
            code: 500,
            success: false,
            message: '服务器错误'
        });
    }
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 