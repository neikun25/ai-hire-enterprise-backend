/**
 * 任务类型定义
 */

export const TASK_TYPES = {
  report: {
    label: '分析报告',
    value: 'report',
    icon: '📊',
    description: '数据分析与研究报告',
    subTypes: [
      { label: '行业研究报告', value: 'industry_research' },
      { label: '数据分析报告', value: 'data_analysis' },
      { label: '商业计划书', value: 'business_plan' },
      { label: '咨询报告', value: 'consulting' },
      { label: '学术报告', value: 'academic' },
    ]
  },
  video: {
    label: '短视频制作',
    value: 'video',
    icon: '🎥',
    description: '视频制作与剪辑',
    subTypes: [
      { label: '视频号内容制作', value: 'wechat_video' },
      { label: '产品宣传视频', value: 'product_promo' },
      { label: '教程视频', value: 'tutorial' },
      { label: '短剧/创意视频', value: 'creative' },
      { label: '直播剪辑', value: 'live_editing' },
      { label: '视频后期', value: 'post_production' },
    ]
  },
  labeling: {
    label: '数据标注',
    value: 'labeling',
    icon: '🏷️',
    description: 'AI训练数据标注',
    subTypes: [
      { label: '图像标注', value: 'image_labeling' },
      { label: '文本标注', value: 'text_labeling' },
      { label: '语音标注', value: 'audio_labeling' },
      { label: '视频标注', value: 'video_labeling' },
      { label: '3D点云标注', value: 'point_cloud' },
      { label: '数据清洗', value: 'data_cleaning' },
    ]
  },
} as const;

export const TASK_STATUS = {
  pending: { label: '待审核', value: 'pending', color: 'orange' },
  approved: { label: '已审核', value: 'approved', color: 'blue' },
  in_progress: { label: '进行中', value: 'in_progress', color: 'cyan' },
  submitted: { label: '待验收', value: 'submitted', color: 'purple' },
  completed: { label: '已完成', value: 'completed', color: 'green' },
  rejected: { label: '已拒绝', value: 'rejected', color: 'red' },
  cancelled: { label: '已取消', value: 'cancelled', color: 'gray' },
} as const;

export const ORDER_STATUS = {
  in_progress: { label: '进行中', value: 'in_progress', color: 'blue' },
  submitted: { label: '待验收', value: 'submitted', color: 'purple' },
  completed: { label: '已完成', value: 'completed', color: 'green' },
  rejected: { label: '被拒绝', value: 'rejected', color: 'red' },
} as const;

export function getTaskTypeLabel(type: string): string {
  const taskType = Object.values(TASK_TYPES).find(t => t.value === type);
  return taskType?.label || type;
}

export function getSubTypeLabel(type: string, subType: string): string {
  const taskType = Object.values(TASK_TYPES).find(t => t.value === type);
  const sub = taskType?.subTypes.find(s => s.value === subType);
  return sub?.label || subType;
}

export function getTaskStatusLabel(status: string): string {
  return TASK_STATUS[status as keyof typeof TASK_STATUS]?.label || status;
}

export function getOrderStatusLabel(status: string): string {
  return ORDER_STATUS[status as keyof typeof ORDER_STATUS]?.label || status;
}
