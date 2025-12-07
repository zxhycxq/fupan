# 按考试日期重新排序数据迁移总结

## 背景

用户希望将现有的考试记录按照考试日期进行排序，最新的考试（日期最近的）排在最前面。

## 需求

- 按考试日期降序排列（最新的在前面）
- 没有考试日期的记录排在最后
- 更新数据库中的 `sort_order` 字段

## 实现方案

### 1. 撤回之前的功能

撤回了之前添加的"排序模式切换"功能，因为：
- 用户只需要一次性按日期排序，不需要切换功能
- 之前的实现理解有误（升序 vs 降序）

### 2. 创建数据库迁移脚本

**文件：** `supabase/migrations/20251207_sort_by_exam_date.sql`

**排序规则：**
1. 有考试日期的记录按日期降序排列（最新的在前面）
2. 没有考试日期的记录排在最后
3. 日期相同的记录保持原有的 `sort_order` 顺序

**SQL逻辑：**
```sql
-- 创建临时表来存储新的排序
CREATE TEMP TABLE temp_sorted_records AS
SELECT 
  id,
  ROW_NUMBER() OVER (
    ORDER BY 
      CASE 
        WHEN exam_date IS NULL THEN 1 
        ELSE 0 
      END,
      exam_date DESC NULLS LAST,
      sort_order ASC
  ) as new_sort_order
FROM exam_records;

-- 更新原表的sort_order
UPDATE exam_records
SET sort_order = temp_sorted_records.new_sort_order
FROM temp_sorted_records
WHERE exam_records.id = temp_sorted_records.id;
```

**关键点：**
- 使用 `ROW_NUMBER()` 窗口函数生成新的序号
- 使用 `CASE` 语句将没有日期的记录排在最后
- `exam_date DESC NULLS LAST` 确保日期降序排列
- `sort_order ASC` 作为第三排序条件，保持相同日期记录的原有顺序

### 3. 执行迁移

使用 `supabase_apply_migration` 工具执行迁移脚本，成功更新了所有记录的 `sort_order` 字段。

## 验证结果

### 最新的10条记录（按sort_order排序）

| 考试名称 | 考试日期 | sort_order |
|---------|---------|-----------|
| 省考第1期 | 2025-12-07 | 1 |
| 省考第37期 | 2025-12-01 | 2 |
| 第37期 | 2025-11-28 | 3 |
| 第37期 | 2025-11-28 | 4 |
| 第36期 | 2025-11-25 | 5 |
| 第36期 | 2025-11-25 | 6 |
| 第45期 | 2025-11-23 | 7 |
| 第35期 | 2025-11-21 | 8 |
| 第34期 | 2025-11-20 | 9 |
| 第33期 | 2025-11-18 | 10 |

### 10月份的记录（按sort_order排序）

| 考试名称 | 考试日期 | sort_order |
|---------|---------|-----------|
| 第26期 | 2025-10-31 | 18 |
| 第25期 | 2025-10-30 | 19 |
| 第24期 | 2025-10-28 | 20 |
| 第40期 | 2025-10-27 | 21 |
| 第23期 | 2025-10-24 | 22 |
| 第21期 | 2025-10-21 | 23 |

## 结果

✅ 数据已成功按照考试日期降序重新排序
✅ 最新的考试（12月、11月）排在前面
✅ 10月份的考试排在11月份之后
✅ 没有日期的记录会排在最后
✅ 用户可以继续使用拖拽功能手动调整顺序

## 后续使用

- 用户可以在考试记录列表页面看到按日期排序的记录
- 如果需要调整顺序，可以使用拖拽功能
- 新上传的记录会自动获得最大的 `sort_order` 值，排在最后
- 如果需要将新记录排在前面，可以手动拖拽调整

## 技术细节

### 窗口函数 ROW_NUMBER()

`ROW_NUMBER()` 是一个窗口函数，为结果集中的每一行分配一个唯一的序号。

**语法：**
```sql
ROW_NUMBER() OVER (ORDER BY column1, column2, ...)
```

**在本次迁移中的使用：**
```sql
ROW_NUMBER() OVER (
  ORDER BY 
    CASE WHEN exam_date IS NULL THEN 1 ELSE 0 END,
    exam_date DESC NULLS LAST,
    sort_order ASC
)
```

**排序逻辑：**
1. 第一排序：`CASE WHEN exam_date IS NULL THEN 1 ELSE 0 END`
   - 有日期的记录返回 0
   - 没有日期的记录返回 1
   - 结果：有日期的排在前面（0 < 1）

2. 第二排序：`exam_date DESC NULLS LAST`
   - 日期降序排列（最新的在前）
   - NULL值排在最后

3. 第三排序：`sort_order ASC`
   - 相同日期的记录按原有的 `sort_order` 升序排列
   - 保持相同日期记录的原有顺序

### 临时表的使用

使用临时表的好处：
- 避免在更新过程中出现数据不一致
- 可以先计算出所有新的 `sort_order` 值
- 然后一次性更新原表

**流程：**
1. 创建临时表 `temp_sorted_records`
2. 在临时表中计算新的 `sort_order`
3. 使用 `UPDATE ... FROM` 语法更新原表
4. 清理临时表

## 总结

本次迁移成功地将所有考试记录按照考试日期降序重新排序，满足了用户的需求。用户不再需要手动拖拽调整顺序，数据已经按照时间顺序排列好了。
