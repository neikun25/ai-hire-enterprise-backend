import { getDb } from "./db";
import { enterprises, individuals, tasks, orders, reviews } from "../drizzle/schema";

/**
 * 添加种子数据用于演示
 * 包含:企业、个人、任务、订单、评价
 */
export async function seedData() {
  const db = await getDb();
  if (!db) {
    console.warn("[Seed] Database not available");
    return;
  }

  try {
    // 1. 创建演示企业
    const [enterprise] = await db.insert(enterprises).values({
      userId: 1,
      companyName: "智能科技有限公司",
      license: "91110000MA01234567",
      contact: "李经理",
      balance: "50000",
      creditScore: "4.8",
      totalTasks: 5,
    }).$returningId();

    // 2. 创建演示个人
    const [individual] = await db.insert(individuals).values({
      userId: 2,
      realName: "张小明",
      skills: JSON.stringify(["数据标注", "Python编程", "报告撰写"]),
      experience: "3年数据标注经验，擅长图像识别和文本分类",
      portfolio: JSON.stringify([]),
      creditScore: "4.6",
      completedTasks: 28,
      successRate: "96.43",
    }).$returningId();

    // 3. 创建已完成的任务
    const [completedTask] = await db.insert(tasks).values({
      enterpriseId: enterprise.id,
      type: "labeling",
      subType: "图像标注",
      title: "电商产品图像数据标注",
      description: "需要对5000张电商产品图片进行分类标注，包括服装、电子产品、家居用品等12个类别。要求标注准确率达到95%以上。",
      budget: "800",
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      requirements: JSON.stringify({
        imageCount: 5000,
        categories: 12,
        accuracy: "95%+",
        format: "JSON",
      }),
      status: "completed",
    }).$returningId();

    // 4. 创建已完成的订单
    const [completedOrder] = await db.insert(orders).values({
      taskId: completedTask.id,
      individualId: individual.id,
      status: "completed",
      submitContent: "已完成全部5000张图片的标注，准确率96.8%，超出预期要求",
      submitAttachments: JSON.stringify(["https://example.com/deliverables/task-001.zip"]),
      submitTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      reviewComment: "工作质量优秀，准确率超过预期，按时完成",
      reviewTime: new Date(Date.now() - 12 * 60 * 60 * 1000),
      actualAmount: "800",
    }).$returningId();

    // 5. 创建进行中的任务
    const [ongoingTask] = await db.insert(tasks).values({
      enterpriseId: enterprise.id,
      type: "report",
      subType: "行业研究",
      title: "行业研究报告撰写",
      description: "撰写人工智能行业2026年度发展趋势报告，包括市场规模、技术趋势、竞争格局分析。",
      budget: "1500",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      requirements: JSON.stringify({
        wordCount: "8000-10000字",
        sections: ["市场规模", "技术趋势", "竞争格局", "未来展望"],
        references: "至少20篇权威来源",
      }),
      status: "in_progress",
    }).$returningId();

    // 6. 创建进行中的订单
    await db.insert(orders).values({
      taskId: ongoingTask.id,
      individualId: individual.id,
      status: "in_progress",
    });

    // 7. 创建待领取的任务
    await db.insert(tasks).values([
      {
        enterpriseId: enterprise.id,
        type: "video",
        subType: "视频号内容",
        title: "视频号短视频脚本创作",
        description: "为企业视频号创作10条短视频脚本，主题围绕AI技术科普。",
        budget: "600",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        requirements: JSON.stringify({
          videoCount: 10,
          duration: "30-60秒/条",
          style: "科普+趣味",
        }),
        status: "approved",
      },
      {
        enterpriseId: enterprise.id,
        type: "labeling",
        subType: "数据清洗",
        title: "Python数据清洗脚本开发",
        description: "开发数据清洗脚本，处理包含缺失值、异常值的CSV数据集。",
        budget: "500",
        deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        requirements: JSON.stringify({
          language: "Python",
          dataSize: "100万行",
          deliverables: "脚本+文档",
        }),
        status: "approved",
      },
    ]);

    console.log("[Seed] Data seeded successfully");
    return {
      success: true,
      data: {
        enterpriseId: enterprise.id,
        individualId: individual.id,
        completedTaskId: completedTask.id,
        completedOrderId: completedOrder.id,
      },
    };
  } catch (error) {
    console.error("[Seed] Failed to seed data:", error);
    throw error;
  }
}

// 如果直接运行此文件，执行种子数据
seedData()
  .then((result) => {
    console.log("Seed completed:", result);
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
