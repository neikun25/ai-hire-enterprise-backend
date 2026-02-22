-- ============================================
-- Open Action 测试数据导入脚本
-- ============================================
-- 用途: 为本地开发环境导入测试数据
-- 使用方法: mysql -u用户名 -p数据库名 < seed-data.sql

-- 清空现有数据（可选，谨慎使用）
-- TRUNCATE TABLE reviews;
-- TRUNCATE TABLE transactions;
-- TRUNCATE TABLE orders;
-- TRUNCATE TABLE tasks;
-- TRUNCATE TABLE individuals;
-- TRUNCATE TABLE enterprises;
-- TRUNCATE TABLE users;

-- ============================================
-- 插入测试用户
-- ============================================
INSERT INTO users (id, openId, name, email, phone, loginMethod, role, createdAt, updatedAt, lastSignedIn) VALUES
(1, 'wx_test_enterprise_001', '测试企业用户', 'enterprise@test.com', '13800138001', 'wechat', 'enterprise', NOW(), NOW(), NOW()),
(2, 'wx_test_individual_001', '测试个人用户', 'individual@test.com', '13800138002', 'wechat', 'individual', NOW(), NOW(), NOW()),
(3, 'wx_test_individual_002', '李明', 'liming@test.com', '13800138003', 'wechat', 'individual', NOW(), NOW(), NOW());

-- ============================================
-- 插入企业信息
-- ============================================
INSERT INTO enterprises (id, userId, companyName, license, contact, balance, creditScore, totalTasks, createdAt, updatedAt) VALUES
(1, 1, '测试科技有限公司', '91110000MA01XXXX', '张经理', 10000.00, 5.0, 0, NOW(), NOW()),
(2, 1, '创新数字营销公司', '91110000MA02YYYY', '王总监', 5000.00, 4.8, 0, NOW(), NOW());

-- ============================================
-- 插入个人信息
-- ============================================
INSERT INTO individuals (id, userId, realName, skills, experience, portfolio, creditScore, completedTasks, successRate, createdAt, updatedAt) VALUES
(1, 2, '李四', '["数据分析", "Python", "Excel", "SQL"]', '3年数据分析经验，擅长市场调研和数据可视化', '[]', 5.0, 0, 100.00, NOW(), NOW()),
(2, 3, '李明', '["视频制作", "剪辑", "特效", "AE", "PR"]', '5年视频制作经验，服务过多家知名品牌', '[]', 4.9, 15, 98.50, NOW(), NOW());

-- ============================================
-- 插入测试任务
-- ============================================

-- 分析报告类任务
INSERT INTO tasks (enterpriseId, type, subType, title, description, requirements, budget, deadline, status, createdAt, updatedAt) VALUES
(1, 'report', 'market_research', '2026年AI行业市场调研报告', '需要对AI行业进行全面的市场调研，包括市场规模、竞争格局、发展趋势等', '1. 市场规模分析（国内外对比）\n2. 主要竞争对手分析\n3. 技术发展趋势预测\n4. 商业模式创新分析\n5. 报告字数不少于5000字', 800.00, DATE_ADD(NOW(), INTERVAL 7 DAY), 'approved', NOW(), NOW()),

(1, 'report', 'competitor_analysis', '竞品分析报告 - 在线教育平台', '分析3-5家主流在线教育平台的产品特点、用户群体、运营策略', '1. 选择3-5家代表性平台\n2. 分析产品功能和用户体验\n3. 对比运营策略和营销手段\n4. 提供SWOT分析\n5. 给出竞争建议', 600.00, DATE_ADD(NOW(), INTERVAL 5 DAY), 'approved', NOW(), NOW()),

(1, 'report', 'user_persona', '电商用户画像分析', '基于用户行为数据，构建典型用户画像，指导产品优化', '1. 分析用户年龄、性别、地域分布\n2. 分析购买行为和偏好\n3. 构建3-5个典型用户画像\n4. 提供产品优化建议', 700.00, DATE_ADD(NOW(), INTERVAL 6 DAY), 'pending', NOW(), NOW());

-- 短视频制作类任务
INSERT INTO tasks (enterpriseId, type, subType, title, description, requirements, budget, deadline, status, createdAt, updatedAt) VALUES
(1, 'video', 'product_promo', '新产品宣传短视频制作', '制作一个30-60秒的产品宣传视频，用于社交媒体推广', '1. 时长30-60秒\n2. 突出产品核心卖点\n3. 配音和字幕\n4. 1080P分辨率\n5. 提供源文件', 1200.00, DATE_ADD(NOW(), INTERVAL 10 DAY), 'approved', NOW(), NOW()),

(1, 'video', 'tutorial', '产品使用教程视频', '制作产品使用教程视频，帮助用户快速上手', '1. 时长3-5分钟\n2. 清晰展示操作步骤\n3. 配音讲解\n4. 添加字幕和标注\n5. 1080P分辨率', 900.00, DATE_ADD(NOW(), INTERVAL 8 DAY), 'in_progress', NOW(), NOW()),

(2, 'video', 'brand_story', '品牌故事短视频', '制作品牌故事视频，展现企业文化和价值观', '1. 时长1-2分钟\n2. 情感化叙事\n3. 配乐和字幕\n4. 4K分辨率\n5. 提供多个版本（横屏、竖屏）', 1500.00, DATE_ADD(NOW(), INTERVAL 12 DAY), 'approved', NOW(), NOW());

-- 数据标注类任务
INSERT INTO tasks (enterpriseId, type, subType, title, description, requirements, budget, isVideoTask, basePrice, pricePerThousandViews, deadline, status, createdAt, updatedAt) VALUES
(1, 'labeling', 'image_annotation', '电商商品图片标注（1000张）', '标注1000张电商商品图片，用于训练AI识别模型', '1. 标注商品类别（服装、电子、食品等）\n2. 标注商品属性（颜色、尺寸、材质等）\n3. 框选商品主体区域\n4. 质量检查，准确率不低于95%', 500.00, 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 5 DAY), 'approved', NOW(), NOW()),

(1, 'labeling', 'text_classification', '用户评论情感分类（5000条）', '对5000条用户评论进行情感分类（正面、中性、负面）', '1. 分类标准：正面、中性、负面\n2. 标注依据：评论内容的整体情感倾向\n3. 提供Excel格式结果\n4. 准确率不低于90%', 400.00, 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 4 DAY), 'approved', NOW(), NOW()),

(1, 'labeling', 'audio_transcription', '会议录音转文字（2小时）', '将2小时的会议录音转换为文字稿', '1. 准确转写会议内容\n2. 区分不同发言人\n3. 添加时间戳\n4. 整理格式，提供Word文档\n5. 准确率不低于98%', 300.00, 0, NULL, NULL, DATE_ADD(NOW(), INTERVAL 3 DAY), 'pending', NOW(), NOW());

-- 视频号任务（按阅读量计价）
INSERT INTO tasks (enterpriseId, type, subType, title, description, requirements, budget, isVideoTask, basePrice, pricePerThousandViews, deadline, status, createdAt, updatedAt) VALUES
(2, 'video', 'product_promo', '视频号产品推广视频', '制作视频号短视频，推广新产品，按阅读量计费', '1. 时长15-30秒\n2. 竖屏9:16比例\n3. 吸引眼球的开头\n4. 清晰的产品展示\n5. 引导关注和购买', 1000.00, 1, 200.00, 50.00, DATE_ADD(NOW(), INTERVAL 15 DAY), 'approved', NOW(), NOW()),

(2, 'video', 'brand_story', '视频号品牌故事', '制作品牌故事视频，提升品牌知名度，按阅读量计费', '1. 时长30-60秒\n2. 竖屏9:16比例\n3. 情感化叙事\n4. 展现品牌价值\n5. 引导关注', 1500.00, 1, 300.00, 80.00, DATE_ADD(NOW(), INTERVAL 20 DAY), 'approved', NOW(), NOW());

-- ============================================
-- 插入测试订单
-- ============================================
INSERT INTO orders (taskId, individualId, status, submitContent, submitTime, actualAmount, createdAt, updatedAt) VALUES
(5, 2, 'in_progress', NULL, NULL, NULL, NOW(), NOW()),
(7, 1, 'submitted', '已完成商品图片标注，共标注1000张图片，准确率达到97%。附件包含标注结果Excel文件。', NOW(), 500.00, DATE_ADD(NOW(), INTERVAL -1 DAY), NOW());

-- ============================================
-- 插入测试评价（可选）
-- ============================================
-- INSERT INTO reviews (orderId, reviewerId, revieweeId, reviewType, rating, comment, createdAt) VALUES
-- (2, 1, 2, 'enterprise_to_individual', 5, '工作认真负责，标注准确率很高，沟通及时，非常满意！', NOW());

-- ============================================
-- 插入测试交易记录（可选）
-- ============================================
-- INSERT INTO transactions (userId, type, amount, balance, relatedId, description, createdAt) VALUES
-- (1, 'recharge', 10000.00, 10000.00, NULL, '账户充值', DATE_ADD(NOW(), INTERVAL -7 DAY)),
-- (1, 'freeze', 500.00, 9500.00, 7, '冻结任务预算 - 电商商品图片标注', DATE_ADD(NOW(), INTERVAL -1 DAY));

-- ============================================
-- 完成提示
-- ============================================
SELECT '✅ 测试数据导入完成！' as message;
SELECT CONCAT('用户数量: ', COUNT(*)) as result FROM users;
SELECT CONCAT('企业数量: ', COUNT(*)) as result FROM enterprises;
SELECT CONCAT('个人数量: ', COUNT(*)) as result FROM individuals;
SELECT CONCAT('任务数量: ', COUNT(*)) as result FROM tasks;
SELECT CONCAT('订单数量: ', COUNT(*)) as result FROM orders;
