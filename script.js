// 存储所有图书数据
let allBooks = [];

// 获取图书列表
async function fetchBooks() {
    const loading = document.getElementById('loading');
    const bookList = document.getElementById('bookList');
    
    try {
        loading.style.display = 'block';
        bookList.style.display = 'none';
        
        const response = await fetch('http://localhost:3000/api/books');
        const data = await response.json();
        
        if (data.records) {
            allBooks = data.records; // 保存所有图书数据
            displayBooks(allBooks);
        } else {
            showError('获取图书列表失败');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('服务器连接失败');
    } finally {
        loading.style.display = 'none';
        bookList.style.display = 'table-row-group';
    }
}

// 显示图书列表
function displayBooks(books) {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = ''; // 清空现有列表

    if (books.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="5" style="text-align: center; padding: 2rem;">
                暂无图书数据
            </td>
        `;
        bookList.appendChild(row);
        return;
    }

    books.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${book.fields.book_id}</td>
            <td>${book.fields.book_name}</td>
            <td>
                <span class="status ${book.fields.book_statue === '未被借走' ? 'available' : 'borrowed'}">
                    ${book.fields.book_statue}
                </span>
            </td>
            <td>${book.fields.book_location}</td>
            <td class="actions-cell">
                <button class="action-btn edit-btn" onclick="openEditBookModal('${book.recordId}')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    编辑
                </button>
            </td>
        `;
        bookList.appendChild(row);
    });
}

// 显示错误信息
function showError(message) {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 2rem; color: #dc3545;">
                ${message}
            </td>
        </tr>
    `;
}

// 搜索和筛选图书
function filterBooks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;

    const filteredBooks = allBooks.filter(book => {
        const matchesSearch = 
            book.fields.book_name.toLowerCase().includes(searchTerm) ||
            book.fields.book_id.toString().includes(searchTerm) ||
            book.fields.book_location.toLowerCase().includes(searchTerm);

        const matchesStatus = !statusFilter || book.fields.book_statue === statusFilter;

        return matchesSearch && matchesStatus;
    });

    displayBooks(filteredBooks);
}

// 添加搜索和筛选事件监听器
function setupSearchAndFilters() {
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    // 使用防抖函数优化搜索性能
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(filterBooks, 300);
    });

    statusFilter.addEventListener('change', filterBooks);
}

// 打开新增图书模态框
function openAddBookModal() {
    const modal = document.getElementById('addBookModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // 防止背景滚动
}

// 关闭新增图书模态框
function closeAddBookModal() {
    const modal = document.getElementById('addBookModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetForm();
}

// 重置表单
function resetForm() {
    const form = document.getElementById('addBookForm');
    form.reset();
    // 清除所有错误信息
    document.querySelectorAll('.error-message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

// 显示错误信息
function showFormError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// 验证表单数据
function validateForm() {
    let isValid = true;
    const bookName = document.getElementById('bookName').value.trim();
    const bookId = document.getElementById('bookId').value.trim();
    const bookLocation = document.getElementById('bookLocation').value.trim();

    // 验证图书名称
    if (bookName.length < 2) {
        showFormError('bookName', '图书名称至少需要2个字符');
        isValid = false;
    }

    // 验证图书ID
    if (!bookId || isNaN(bookId)) {
        showFormError('bookId', '请输入有效的图书ID');
        isValid = false;
    } else if (allBooks.some(book => book.fields.book_id === parseInt(bookId))) {
        showFormError('bookId', '该图书ID已存在');
        isValid = false;
    }

    // 验证位置
    if (bookLocation.length < 2) {
        showFormError('bookLocation', '位置信息至少需要2个字符');
        isValid = false;
    }

    return isValid;
}

// 处理新增图书
async function handleAddBook(event) {
    event.preventDefault();
    
    if (!validateForm()) {
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '添加中...';

    try {
        const bookData = {
            fields: {
                book_name: document.getElementById('bookName').value.trim(),
                book_id: parseInt(document.getElementById('bookId').value),
                book_statue: document.getElementById('bookStatus').value,
                book_location: document.getElementById('bookLocation').value.trim()
            }
        };

        const response = await fetch('http://localhost:3000/api/books', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });

        const result = await response.json();

        if (result.success) {
            // 添加成功后刷新图书列表
            await fetchBooks();
            closeAddBookModal();
            // 显示成功提示
            alert('图书添加成功！');
        } else {
            throw new Error(result.message || '添加图书失败');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('添加图书失败：' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '添加图书';
    }
}

// 点击模态框外部关闭
window.onclick = function(event) {
    const addModal = document.getElementById('addBookModal');
    const editModal = document.getElementById('editBookModal');
    if (event.target === addModal) {
        closeAddBookModal();
    }
    if (event.target === editModal) {
        closeEditBookModal();
    }
}

// 打开编辑图书模态框
function openEditBookModal(recordId) {
    const book = allBooks.find(b => b.recordId === recordId);
    if (!book) return;

    // 填充表单数据
    document.getElementById('editRecordId').value = recordId;
    document.getElementById('editBookName').value = book.fields.book_name;
    document.getElementById('editBookId').value = book.fields.book_id;
    document.getElementById('editBookStatus').value = book.fields.book_statue;
    document.getElementById('editBookLocation').value = book.fields.book_location;

    // 显示模态框
    const modal = document.getElementById('editBookModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭编辑图书模态框
function closeEditBookModal() {
    const modal = document.getElementById('editBookModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    resetEditForm();
}

// 重置编辑表单
function resetEditForm() {
    const form = document.getElementById('editBookForm');
    form.reset();
    document.querySelectorAll('#editBookForm .error-message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

// 验证编辑表单
function validateEditForm() {
    let isValid = true;
    const bookName = document.getElementById('editBookName').value.trim();
    const bookLocation = document.getElementById('editBookLocation').value.trim();

    // 验证图书名称
    if (bookName.length < 2) {
        showFormError('editBookName', '图书名称至少需要2个字符');
        isValid = false;
    }

    // 验证位置
    if (bookLocation.length < 2) {
        showFormError('editBookLocation', '位置信息至少需要2个字符');
        isValid = false;
    }

    return isValid;
}

// 处理编辑图书
async function handleEditBook(event) {
    event.preventDefault();
    
    if (!validateEditForm()) {
        return;
    }

    const submitBtn = document.getElementById('editSubmitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = '保存中...';

    try {
        const recordId = document.getElementById('editRecordId').value;
        const bookData = {
            fields: {
                book_name: document.getElementById('editBookName').value.trim(),
                book_id: document.getElementById('editBookId').value,
                book_statue: document.getElementById('editBookStatus').value,
                book_location: document.getElementById('editBookLocation').value.trim()
            }
        };

        const response = await fetch(`http://localhost:3000/api/books/${recordId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookData)
        });

        const result = await response.json();

        if (result.success) {
            // 更新成功后刷新图书列表
            await fetchBooks();
            closeEditBookModal();
            // 显示成功提示
            alert('图书更新成功！');
        } else {
            throw new Error(result.message || '更新图书失败');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('更新图书失败：' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = '保存修改';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    fetchBooks();
    setupSearchAndFilters();
}); 