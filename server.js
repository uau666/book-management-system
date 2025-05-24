const express = require('express');
const { Vika } = require('@vikadata/vika');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 添加请求时间记录中间件
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.url} - ${duration}ms`);
    });
    next();
});

// 初始化 Vika SDK
const vika = new Vika({ 
    token: process.env.VIKA_TOKEN || "uskFocCBUtljNHeAX5AOhRU", 
    fieldKey: "name" 
});

// 指定数据表
const datasheet = vika.datasheet(process.env.VIKA_DATASHEET_ID || "dstouAM0RMpGKD3STi");

// 添加缓存
let booksCache = {
    data: null,
    timestamp: 0
};
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 查询所有图书接口
app.get('/api/books', async (req, res) => {
    try {
        // 检查缓存是否有效
        const now = Date.now();
        if (booksCache.data && (now - booksCache.timestamp) < CACHE_DURATION) {
            console.log('返回缓存数据');
            return res.json(booksCache.data);
        }

        console.log('从维格表获取数据');
        const response = await datasheet.records.query({ 
            viewId: process.env.VIKA_VIEW_ID || "viwHrFyrUrVXC"
        });
        
        if (response.success) {
            // 更新缓存
            booksCache.data = response.data;
            booksCache.timestamp = now;
            res.json(response.data);
        } else {
            res.status(500).json({ error: '获取图书列表失败' });
        }
    } catch (error) {
        console.error('Error:', error);
        // 如果有缓存数据，在出错时返回缓存
        if (booksCache.data) {
            console.log('出错时返回缓存数据');
            return res.json(booksCache.data);
        }
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

// 添加根路由处理
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 