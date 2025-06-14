/**
 * 金额处理工具函数
 * 解决JavaScript浮点数精度问题
 */

/**
 * 安全的金额转换函数，将元转换为分
 * @param {number|string} amount 金额（元）
 * @returns {number} 金额（分）
 */
export function convertYuanToCent(amount) {
	// 将数字转换为字符串，避免浮点数精度问题
	const amountStr = parseFloat(amount).toFixed(2)
	// 找到小数点位置
	const dotIndex = amountStr.indexOf('.')
	if (dotIndex === -1) {
		// 没有小数点，直接乘以100
		return parseInt(amountStr) * 100
	} else {
		// 有小数点，移除小数点后转换为整数
		const integerPart = amountStr.substring(0, dotIndex)
		const decimalPart = amountStr.substring(dotIndex + 1)
		// 确保小数部分有两位
		const paddedDecimal = decimalPart.padEnd(2, '0').substring(0, 2)
		return parseInt(integerPart + paddedDecimal)
	}
}

/**
 * 安全的金额转换函数，将分转换为元
 * @param {number} cents 金额（分）
 * @returns {number} 金额（元）
 */
export function convertCentToYuan(cents) {
	return Math.floor(cents) / 100
}

/**
 * 格式化金额显示
 * @param {number} cents 金额（分）
 * @param {number} decimals 小数位数，默认2位
 * @returns {string} 格式化后的金额字符串
 */
export function formatAmount(cents, decimals = 2) {
	const yuan = convertCentToYuan(cents)
	return yuan.toFixed(decimals)
} 