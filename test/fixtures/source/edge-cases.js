// 测试不同的 t() 调用方式

// 标准调用
const text1 = t('standard.key');

// 带空格
const text2 = t(  'with.spaces'  );

// 带换行
const text3 = t(
  'with.newline'
);

// 使用双引号
const text4 = t("double.quotes");

// 使用反引号但不包含插值
const text5 = t(`backtick.key`);

// 注释中的 t() - 应该被提取
// const commented = t('comment.key');
/* const blockComment = t('block.comment.key'); */

// 字符串中包含特殊字符
const text6 = t('special-chars_123.key');

// 多个 t() 在同一行
const multi = t('first.key') + ' ' + t('second.key');

// 嵌套在对象中
const obj = {
  label: t('object.label'),
  title: t('object.title')
};

// 嵌套在数组中
const arr = [
  t('array.first'),
  t('array.second')
];

// 作为函数参数
console.log(t('function.arg'));
someFunction(t('another.arg'), otherParam);

// 条件表达式中
const conditional = condition ? t('condition.true') : t('condition.false');

// 模板字符串中不包含变量
const template = `Hello ${t('template.key')}`;
