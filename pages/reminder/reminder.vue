<template>
	<view class="budget-reminder">
		<!-- 月度预算设置 -->
		<mj-card title="月度预算" subTitle="设置每月支出预算，超额时自动提醒">
			<view class="budget-section">
				<mj-section 
					title="当前预算" 
					:subTitle="currentBudget.amount > 0 ? `￥${currentBudget.amount.toFixed(2)}` : '未设置'" 
					iconType="mj-yuan-circle"
					:showIcon="true"
				>
					<template #right>
						<view class="section-right">
							<u-button 
								text="设置" 
								type="primary" 
								size="mini" 
								color="#65915b"
								@click="openBudgetModal"
							></u-button>
						</view>
					</template>
				</mj-section>

				<!-- 预算使用情况 -->
				<view v-if="currentBudget.amount > 0" class="budget-usage">
					<view class="usage-header">
						<text class="usage-title">本月使用情况</text>
						<text class="usage-percent">{{ budgetUsagePercent }}%</text>
					</view>
					<view class="usage-bar">
						<view 
							class="usage-progress" 
							:style="{ width: Math.min(budgetUsagePercent, 100) + '%', backgroundColor: getProgressColor() }"
						></view>
					</view>
					<view class="usage-info">
						<text class="used-amount">已用：￥{{ monthlyExpense.toFixed(2) }}</text>
						<text class="remain-amount">剩余：￥{{ (currentBudget.amount - monthlyExpense).toFixed(2) }}</text>
					</view>
				</view>

				<!-- 预算提醒设置 -->
				<mj-section 
					title="预算提醒" 
					:subTitle="currentBudget.isEnabled ? '已启用' : '已关闭'" 
					iconType="mj-notification"
					:showIcon="true"
				>
					<template #right>
						<u-switch 
							v-model="currentBudget.isEnabled" 
							activeColor="#65915b"
							@change="updateBudgetSetting"
						></u-switch>
					</template>
				</mj-section>

				<!-- 预警阈值设置 -->
				<mj-section 
					v-if="currentBudget.isEnabled"
					title="预警阈值" 
					:subTitle="`使用${currentBudget.warningThreshold}%时提醒`" 
					iconType="mj-stop"
					:showIcon="true"
				>
					<template #right>
						<view class="threshold-setting">
							<u-slider 
								v-model="currentBudget.warningThreshold" 
								activeColor="#65915b"
								inactiveColor="#f2f2f2"
								blockColor="#65915b"
								:min="50"
								:max="100"
								:step="10"
								@change="updateBudgetSetting"
							></u-slider>
						</view>
					</template>
				</mj-section>
			</view>
		</mj-card>

		<!-- 存钱目标 -->
		<mj-card title="存钱目标" subTitle="设置存钱目标，跟踪进度">
			<view class="saving-goals">
				<view v-if="savingGoals.length === 0" class="no-goals">
					<text class="no-goals-text">暂无存钱目标</text>
				</view>
				
				<view v-for="goal in savingGoals" :key="goal._id" class="goal-item">
					<view class="goal-header">
						<text class="goal-name">{{ goal.goal_name }}</text>
						<text class="goal-status" :class="{ 'completed': goal.is_completed }">
							{{ goal.is_completed ? '已完成' : '进行中' }}
						</text>
					</view>
					
					<view class="goal-progress">
						<view class="progress-info">
							<text class="current">￥{{ ((goal.current_amount || 0) / 100).toFixed(2) }}</text>
							<text class="target">目标：￥{{ (goal.target_amount / 100).toFixed(2) }}</text>
						</view>
						<view class="progress-bar">
							<view 
								class="progress-fill" 
								:style="{ width: Math.min(((goal.current_amount || 0) / goal.target_amount) * 100, 100) + '%' }"
							></view>
						</view>
						<view class="progress-percent">
							{{ Math.floor(((goal.current_amount || 0) / goal.target_amount) * 100) }}%
						</view>
					</view>
					
					<view class="goal-dates">
						<text class="date-info">{{ formatDateRange(goal.start_date, goal.end_date) }}</text>
					</view>
					
					<view class="goal-actions">
						<u-button 
							text="编辑" 
							size="mini" 
							type="primary" 
							color="#65915b"
							@click="editGoal(goal)"
						></u-button>
						<u-button 
							text="删除" 
							size="mini" 
							type="error" 
							color="#f56c6c"
							@click="deleteGoal(goal._id)"
						></u-button>
					</view>
				</view>
				
				<view class="add-goal">
					<u-button 
						text="添加存钱目标" 
						type="primary" 
						color="#65915b"
						icon="plus"
						@click="openGoalModal"
					></u-button>
				</view>
			</view>
		</mj-card>

		<!-- 月度预算设置弹窗 -->
		<u-modal 
			:show="showBudgetModal" 
			title="设置月度预算"
			confirmColor="#65915b"
			:showCancelButton="true"
			@confirm="saveBudgetSetting"
			@cancel="showBudgetModal = false"
			@close="showBudgetModal = false"
		>
			<view class="modal-content">
				<u-form :model="budgetForm" ref="budgetFormRef">
					<u-form-item label="预算金额" prop="amount" label-width="80">
						<u-input v-model="budgetForm.amount" placeholder="请输入预算金额" type="number" border="surround">
							<template #suffix>元</template>
						</u-input>
					</u-form-item>
					<u-form-item label="预警阈值" prop="warningThreshold" label-width="80">
						<u-input v-model="budgetForm.warningThreshold" placeholder="使用百分比" type="number" border="surround">
							<template #suffix>%</template>
						</u-input>
					</u-form-item>
				</u-form>
			</view>
		</u-modal>

		<!-- 存钱目标设置弹窗 -->
		<u-modal 
			:show="showGoalModal" 
			:title="isEditingGoal ? '编辑存钱目标' : '添加存钱目标'"
			confirmColor="#65915b"
			:showCancelButton="true"
			@confirm="saveGoal"
			@cancel="showGoalModal = false"
			@close="showGoalModal = false"
		>
			<view class="modal-content">
				<u-form :model="goalForm" ref="goalFormRef">
					<u-form-item label="目标名称" prop="goalName" label-width="80">
						<u-input v-model="goalForm.goalName" placeholder="请输入目标名称" border="surround"></u-input>
					</u-form-item>
					<u-form-item label="目标金额" prop="targetAmount" label-width="80">
						<u-input v-model="goalForm.targetAmount" placeholder="请输入目标金额" type="number" border="surround">
							<template #suffix>元</template>
						</u-input>
					</u-form-item>
					<u-form-item label="开始日期" prop="startDate" label-width="80">
						<u-input v-model="goalForm.startDate" placeholder="选择开始日期" readonly border="surround" @click.native="prepareStartDatePicker"></u-input>
					</u-form-item>
					<u-form-item label="目标日期" prop="endDate" label-width="80">
						<u-input v-model="goalForm.endDate" placeholder="选择目标完成日期" readonly border="surround" @click.native="prepareEndDatePicker"></u-input>
					</u-form-item>
				</u-form>
			</view>
		</u-modal>

		<!-- 日期选择器 -->
		<u-datetime-picker 
			:show="showStartDatePicker"
			v-model="pickerStartDateTimestamp"
			mode="date"
			@confirm="onStartDateConfirm"
			@cancel="showStartDatePicker = false"
		></u-datetime-picker>
		
		<u-datetime-picker 
			:show="showEndDatePicker"
			v-model="pickerEndDateTimestamp"
			:min-date="minTimestampForEndDate"
			mode="date"
			@confirm="onEndDateConfirm"
			@cancel="showEndDatePicker = false"
		></u-datetime-picker>
	</view>
</template>

<script>
const db = uniCloud.database()

export default {
	name: 'BudgetReminder',
	data() {
		return {
			// 当前预算信息
			currentBudget: {
				id: '',
				amount: 0,
				isEnabled: true,
				warningThreshold: 80,
				month: ''
			},
			
			// 本月支出
			monthlyExpense: 0,
			
			// 存钱目标列表
			savingGoals: [],
			
			// 弹窗控制
			showBudgetModal: false,
			showGoalModal: false,
			showStartDatePicker: false,
			showEndDatePicker: false,
			
			// 表单数据
			budgetForm: {
				amount: '',
				warningThreshold: 80
			},
			
			goalForm: {
				goalName: '',
				targetAmount: '',
				startDate: '',
				endDate: ''
			},
			
			// 编辑状态
			isEditingGoal: false,
			editingGoalId: '',
			
			// 日期选择器v-model和min-date辅助属性
			pickerStartDateTimestamp: null,
			pickerEndDateTimestamp: null,
			minTimestampForEndDate: null
		}
	},
	
	computed: {
		// 预算使用百分比
		budgetUsagePercent() {
			if (this.currentBudget.amount <= 0) return 0
			return Math.floor((this.monthlyExpense / this.currentBudget.amount) * 100)
		}
	},
	
	onLoad() {
		this.initData()
		uni.$on('savingGoalsMightUpdate', this.handleSavingGoalUpdate); // 监听事件
	},

    onShow() {
        this.initData()
    },
	
	onUnload() {
		uni.$off('savingGoalsMightUpdate', this.handleSavingGoalUpdate); // 移除监听
	},
	
	methods: {
		// 初始化数据
		async initData() {
			await this.getCurrentMonthBudget()
			await this.getMonthlyExpense()
			await this.getSavingGoals()
		},
		
		// 获取当前月份预算
		async getCurrentMonthBudget() {
			try {
				const currentMonth = uni.$u.timeFormat(Date.now(), 'yyyy-mm')
				const res = await db.collection('pockfi-user-budgets')
					.where(`user_id == $cloudEnv_uid && budget_month == "${currentMonth}"`)
					.get()
				
				if (res.result.data.length > 0) {
					const budget = res.result.data[0]
					this.currentBudget = {
						id: budget._id,
						amount: budget.budget_amount / 100,
						isEnabled: budget.is_enabled,
						warningThreshold: budget.warning_threshold,
						month: budget.budget_month
					}
				} else {
					this.currentBudget.month = currentMonth
				}
			} catch (error) {
				console.error('获取预算失败:', error)
				uni.showToast({
					title: '获取预算失败',
					icon: 'error'
				})
			}
		},
		
		// 获取本月支出
		async getMonthlyExpense() {
			try {
				const currentMonth = uni.$u.timeFormat(Date.now(), 'yyyy-mm')
				const res = await db.collection("mj-user-bills")
					.where(`user_id == $cloudEnv_uid && dateToString(add(new Date(0),bill_date),"%Y-%m","+0800") == "${currentMonth}"`)
					.groupBy('bill_type')
					.groupField('sum(bill_amount) as bill_amount_total, sum(transfer_amount) as total_transfer_amount')
					.get()
				
				const expenseData = res.result.data.find(item => item.bill_type === 0);
				const transferData = res.result.data.find(item => item.bill_type === 2);

				const monthlyExpenseTemp = expenseData ? expenseData.bill_amount_total / 100 : 0;
				const transferFeeTemp = transferData ? transferData.bill_amount_total / 100 : 0;
				const transferAmountTemp = transferData ? (transferData.total_transfer_amount || 0) / 100 : 0;

				this.monthlyExpense = Number(monthlyExpenseTemp) + Number(transferFeeTemp) + Number(transferAmountTemp);
			} catch (error) {
				console.error('获取月支出失败:', error)
			}
		},
		
		// 获取存钱目标
		async getSavingGoals() {
			try {
				const res = await db.collection('pockfi-user-saving-goals')
					.where('user_id == $cloudEnv_uid')
					.orderBy('creation_date desc')
					.get()
				
				const goalsFromDB = res.result.data;
				if (!goalsFromDB) {
					this.savingGoals = [];
					this.checkAndNotifyCompletedGoals(); // 即使为空，也调用一下确保UI正确
					return;
				}

				// 为每个目标重新计算进度和状态
				const updatedGoalsPromises = goalsFromDB.map(goal => this.updateGoalBasedOnActualIncome(goal));
				const processedGoals = await Promise.all(updatedGoalsPromises);
				
				this.savingGoals = processedGoals.filter(g => g !== null); // 过滤掉可能处理失败的目标 (虽然目前都返回goal)

				this.checkAndNotifyCompletedGoals(); // 获取并处理完所有目标后，再检查是否有新完成的目标需要提示
			} catch (error) {
				console.error('获取或处理存钱目标失败:', error)
				uni.showToast({
					title: '获取存钱目标失败',
					icon: 'error'
				})
				this.savingGoals = []; // 出错时清空列表
				this.checkAndNotifyCompletedGoals(); // 清空后也调用
			}
		},
		
		async updateGoalBasedOnActualIncome(goal) {
			// 如果目标本身未启用，则不处理其进度, 直接返回原始goal，不做修改
			// 但为了UI显示一致性，可以将其current_amount视为0
			if (!goal.is_enabled) {
				goal.current_amount = 0; // 假设未启用的目标当前就是0
				goal.is_completed = false; // 确保未启用目标不是完成状态
				return goal; 
			}
		
			try {
				let dateCondition = db.command.gte(goal.start_date);
				if (goal.end_date) {
					// 如果end_date是当天，则需要包含当天结束的时间点，例如 23:59:59.999
					// 为简单起见，假设end_date存的是日期开始的时间戳，那么查询时需要 lte(goal.end_date + 24*60*60*1000 -1) 
					// 或者，如果存的就是当天的23:59:59，则直接lte(goal.end_date)
					// JQL中直接比较时间戳即可
					dateCondition = dateCondition.and(db.command.lte(goal.end_date));
				} else {
					// 如果没有结束日期（或为null/undefined），则统计到当前时间
					dateCondition = dateCondition.and(db.command.lte(Date.now()));
				}
		
				const incomeRes = await db.collection('mj-user-bills')
					.where({
						user_id: db.env.uid, 
						bill_type: 1, // 收入类型
						bill_date: dateCondition 
					})
					.groupBy('user_id') 
					.groupField('sum(bill_amount) as totalIncome')
					.get();
		
				let actualCurrentAmount = 0; // 单位：分
				if (incomeRes.result.data.length > 0 && incomeRes.result.data[0].totalIncome) {
					actualCurrentAmount = incomeRes.result.data[0].totalIncome;
				}
		
				const updates = {};
				let needsDBUpdate = false;
		
				// 1. 更新 current_amount (如果它与实际计算的不符)
				if (goal.current_amount !== actualCurrentAmount) {
					updates.current_amount = actualCurrentAmount;
					needsDBUpdate = true;
				}
		
				// 2. 更新 is_completed 状态
				const shouldBeCompleted = actualCurrentAmount >= goal.target_amount;
				if (goal.is_completed !== shouldBeCompleted) {
					updates.is_completed = shouldBeCompleted;
					if (shouldBeCompleted) {
						// 从未完成到完成
						updates.completion_date = goal.completion_date || Date.now(); // 保留原完成日期或设新
						// completion_shown_to_user 由 checkAndNotifyCompletedGoals 控制，这里不主动改true
					} else {
						// 从完成到未完成
						updates.completion_date = null;
						updates.completion_shown_to_user = false; // 重置提示状态
					}
					needsDBUpdate = true;
				} else if (shouldBeCompleted && !goal.completion_date) {
					// 特殊情况：状态是已完成，但日期是空的，则补上日期 (确保数据完整性)
					updates.completion_date = Date.now();
					needsDBUpdate = true;
				}
		
		
				if (needsDBUpdate) {
					await db.collection('pockfi-user-saving-goals').doc(goal._id).update(updates);
					// 返回更新后的goal对象，以便this.savingGoals能拿到最新数据
					return { ...goal, ...updates }; 
				} else {
					// 如果数据库无需更新，但本地的current_amount可能基于旧的累加逻辑不准，也校准一下
					if (goal.current_amount !== actualCurrentAmount) {
						goal.current_amount = actualCurrentAmount; // 只更新本地副本
					}
					return goal; // 无需更新DB，返回原始（或本地校准后） goal
				}
		
			} catch (error) {
				console.error(`更新目标 [${goal.goal_name}] (${goal._id}) 实际进度失败:`, error);
				// 出错时，返回原始 goal，避免影响列表渲染，但控制台会有错误提示
				return goal; 
			}
		},
		
		// 处理存钱目标可能更新的事件
		handleSavingGoalUpdate() {
			console.log('BudgetReminder: Received savingGoalsMightUpdate event');
			this.getSavingGoals(); // 重新获取存钱目标列表
		},

		// 检查并提示已完成但尚未通知用户的存钱目标
		async checkAndNotifyCompletedGoals() {
			const goalsToNotify = this.savingGoals.filter(goal => goal.is_completed && !goal.completion_shown_to_user);

			if (goalsToNotify.length > 0) {
				const completedGoalNames = goalsToNotify.map(goal => goal.goal_name);
				uni.showModal({
					title: '恭喜！目标已达成！',
					content: `您的存钱目标: "${completedGoalNames.join('", "')}" 已完成！`,
					showCancel: false,
					confirmText: '查看详情',
					success: async (res) => {
						if (res.confirm) {
							// 标记这些目标为已通知用户
							// 注意：这里只标记，实际的is_completed状态由updateGoalBasedOnActualIncome保证
							const updatesToNotify = goalsToNotify.map(g => {
								return db.collection('pockfi-user-saving-goals').doc(g._id).update({
									completion_shown_to_user: true
								});
							});
							try {
								await Promise.all(updatesToNotify);
								// 更新本地数据
								goalsToNotify.forEach(notifiedGoal => {
									const localGoal = this.savingGoals.find(g => g._id === notifiedGoal._id);
									if (localGoal) {
										localGoal.completion_shown_to_user = true;
									}
								});
							} catch (error) {
								console.error(`批量标记目标为已通知失败:`, error);
							}
						}
					}
				});
			}
		},
		
		// 更新预算设置（仅更新启用状态和预警阈值）
		async updateBudgetSetting() {
			try {
				if (this.currentBudget.id) {
					await db.collection('pockfi-user-budgets')
						.doc(this.currentBudget.id)
						.update({
							is_enabled: this.currentBudget.isEnabled,
							warning_threshold: this.currentBudget.warningThreshold
							// update_date 会由数据库自动处理
						})
					uni.showToast({
						title: '设置已保存',
						icon: 'success'
					})
				} else {
					// 如果没有预算记录，则不执行操作，或者提示用户先设置预算
					uni.showToast({
						title: '请先设置月度预算',
						icon: 'none'
					})
				}
			} catch (error) {
				console.error('更新预算设置失败:', error)
				uni.showToast({
					title: '保存失败',
					icon: 'error'
				})
			}
		},
		
		// 保存预算设置
		async saveBudgetSetting() {
			if (!this.budgetForm.amount || Number(this.budgetForm.amount) <= 0) {
				uni.showToast({
					title: '请输入有效的预算金额',
					icon: 'none'
				})
				return
			}
			
			try {
				const budgetData = {
					budget_month: this.currentBudget.month,
					budget_amount: Math.round(Number(this.budgetForm.amount) * 100),
					is_enabled: true, // 默认启用
					warning_threshold: Number(this.budgetForm.warningThreshold) || 80
					// update_date 会由数据库自动处理
				}
				
				if (this.currentBudget.id) {
					// 更新现有预算
					await db.collection('pockfi-user-budgets')
						.doc(this.currentBudget.id)
						.update(budgetData)
				} else {
					// 创建新预算，添加创建时间
					const res = await db.collection('pockfi-user-budgets').add(budgetData) // creation_date 也会自动处理
					this.currentBudget.id = res.result.id
				}
				
				// 更新本地数据
				this.currentBudget.amount = Number(this.budgetForm.amount)
				this.currentBudget.warningThreshold = Number(this.budgetForm.warningThreshold) || 80
				this.currentBudget.isEnabled = true // 与 budgetData 保持一致
				this.showBudgetModal = false
				
				uni.showToast({
					title: '预算设置成功',
					icon: 'success'
				})
			} catch (error) {
				console.error('保存预算失败:', error)
				uni.showToast({
					title: '保存预算失败',
					icon: 'error'
				})
			}
		},
		
		// 保存存钱目标
		async saveGoal() {
			if (!this.goalForm.goalName || !this.goalForm.targetAmount || !this.goalForm.startDate || !this.goalForm.endDate) {
				uni.showToast({
					title: '请填写完整信息',
					icon: 'none'
				})
				return
			}
			
			if (Number(this.goalForm.targetAmount) <= 0) {
				uni.showToast({
					title: '请输入有效的目标金额',
					icon: 'none'
				})
				return
			}
			
			// 校验结束日期不能早于开始日期
			if (new Date(this.goalForm.endDate).getTime() < new Date(this.goalForm.startDate).getTime()) {
				uni.showToast({
					title: '结束日期不能早于开始日期',
					icon: 'none'
				});
				return;
			}
			
			try {
				const goalData = {
					goal_name: this.goalForm.goalName,
					target_amount: Math.round(Number(this.goalForm.targetAmount) * 100),
					start_date: new Date(this.goalForm.startDate).getTime(),
					end_date: new Date(this.goalForm.endDate).getTime()
					// creation_date 和 update_date 会由数据库自动处理
				}
				
				if (this.isEditingGoal) {
					// 编辑存钱目标
					await db.collection('pockfi-user-saving-goals')
						.doc(this.editingGoalId)
						.update(goalData)
				} else {
					// 新增存钱目标，还可以设置默认的 current_amount 和 is_completed, is_enabled
					const newGoalData = {
						...goalData,
						current_amount: 0, // 新目标初始为0
						is_completed: false,
						is_enabled: true
					}
					await db.collection('pockfi-user-saving-goals').add(newGoalData)
				}
				
				await this.getSavingGoals() // 重新获取列表
				this.resetGoalForm()
				this.showGoalModal = false
				
				uni.showToast({
					title: this.isEditingGoal ? '更新成功' : '添加成功',
					icon: 'success'
				})
			} catch (error) {
				console.error('保存存钱目标失败:', error)
				uni.showToast({
					title: '保存失败',
					icon: 'error'
				})
			}
		},
		
		// 编辑存钱目标
		editGoal(goal) {
			this.isEditingGoal = true
			this.editingGoalId = goal._id
			this.goalForm = {
				goalName: goal.goal_name,
				targetAmount: (goal.target_amount / 100).toString(),
				startDate: uni.$u.timeFormat(goal.start_date, 'yyyy-mm-dd'),
				endDate: uni.$u.timeFormat(goal.end_date, 'yyyy-mm-dd')
			}
			// 初始化picker的v-model值
			this.pickerStartDateTimestamp = goal.start_date; // goal.start_date 是时间戳
			if (goal.end_date) {
				this.pickerEndDateTimestamp = goal.end_date; // goal.end_date 是时间戳
			} else {
				this.pickerEndDateTimestamp = null;
			}
			this.showGoalModal = true
		},
		
		// 删除存钱目标
		async deleteGoal(goalId) {
			try {
				const modalRes = await uni.showModal({
					title: '提示',
					content: '确定要删除这个存钱目标吗？',
					confirmColor: '#f56c6c'
				})
				
				if (modalRes.confirm) {
					await db.collection('pockfi-user-saving-goals').doc(goalId).remove()
					await this.getSavingGoals()
					uni.showToast({
						title: '删除成功',
						icon: 'success'
					})
				}
			} catch (error) {
				console.error('删除存钱目标失败:', error)
				uni.showToast({
					title: '删除失败',
					icon: 'error'
				})
			}
		},
		
		// 重置目标表单
		resetGoalForm() {
			this.isEditingGoal = false
			this.editingGoalId = ''
			this.goalForm = {
				goalName: '',
				targetAmount: '',
				startDate: '',
				endDate: ''
			}
		},
		
		// 日期选择确认
		onStartDateConfirm(eventParams) {
			console.log('onStartDateConfirm eventParams:', eventParams);
			const timestamp = typeof eventParams === 'object' && eventParams !== null && eventParams.value !== undefined ? eventParams.value : eventParams;
			console.log('Extracted timestamp for startDate:', timestamp);
			if (timestamp === undefined || timestamp === null || isNaN(new Date(timestamp).getTime())) {
				console.error('Invalid timestamp received for startDate:', timestamp);
				this.showStartDatePicker = false;
				uni.showToast({ title: '日期选择出错', icon: 'none' });
				return;
			}
			this.goalForm.startDate = uni.$u.timeFormat(timestamp, 'yyyy-mm-dd');
			this.pickerStartDateTimestamp = timestamp; // 同步v-model
			this.showStartDatePicker = false;

			// 如果已设置的结束日期早于新的开始日期，则清空结束日期
			if (this.goalForm.endDate) {
				const newStartDate = new Date(this.goalForm.startDate).getTime();
				const currentEndDate = new Date(this.goalForm.endDate).getTime();
				if (currentEndDate < newStartDate) {
					this.goalForm.endDate = '';
					this.pickerEndDateTimestamp = null; // 也清空结束日期选择器的v-model
				}
			}
		},
		
		onEndDateConfirm(eventParams) {
			console.log('onEndDateConfirm eventParams:', eventParams);
			const timestamp = typeof eventParams === 'object' && eventParams !== null && eventParams.value !== undefined ? eventParams.value : eventParams;
			console.log('Extracted timestamp for endDate:', timestamp);
			 if (timestamp === undefined || timestamp === null || isNaN(new Date(timestamp).getTime())) {
				console.error('Invalid timestamp received for endDate:', timestamp);
				this.showEndDatePicker = false;
				uni.showToast({ title: '日期选择出错', icon: 'none' });
				return;
			}
			this.goalForm.endDate = uni.$u.timeFormat(timestamp, 'yyyy-mm-dd');
			this.pickerEndDateTimestamp = timestamp; // 同步v-model
			this.showEndDatePicker = false;
		},
		
		// 格式化日期范围
		formatDateRange(startDate, endDate) {
			const start = uni.$u.timeFormat(startDate, 'yyyy-mm-dd')
			const end = endDate ? uni.$u.timeFormat(endDate, 'yyyy-mm-dd') : '无截止';
			return `${start} 至 ${end}`
		},
		
		// 获取进度条颜色
		getProgressColor() {
			const percent = this.budgetUsagePercent
			if (percent >= 100) return '#f56c6c'
			if (percent >= this.currentBudget.warningThreshold) return '#e6a23c'
			return '#67c23a'
		},
		
		// 打开预算设置弹窗
		openBudgetModal() {
			this.showBudgetModal = true
			this.budgetForm = {
				amount: this.currentBudget.amount > 0 ? this.currentBudget.amount.toFixed(2) : '',
				warningThreshold: this.currentBudget.warningThreshold
			}
		},
		
		// 打开存钱目标设置弹窗
		openGoalModal() {
			this.isEditingGoal = false
			this.editingGoalId = ''
			this.showGoalModal = true
			this.goalForm = {
				goalName: '',
				targetAmount: '',
				startDate: uni.$u.timeFormat(Date.now(), 'yyyy-mm-dd'),
				endDate: ''
			}
			// 初始化picker的v-model值 和 minTimestampForEndDate
			const now = new Date(this.goalForm.startDate);
			this.pickerStartDateTimestamp = now.getTime();
			this.pickerEndDateTimestamp = null; 
			this.minTimestampForEndDate = now.getTime(); // 结束日期至少是开始日期当天
		},

		prepareStartDatePicker() {
			if (this.goalForm.startDate) {
				this.pickerStartDateTimestamp = new Date(this.goalForm.startDate).getTime();
			} else {
				// 一般在openGoalModal中已设置startDate，这里作为后备
				const now = Date.now();
				this.pickerStartDateTimestamp = now;
				this.goalForm.startDate = uni.$u.timeFormat(now, 'yyyy-mm-dd');
			}
			this.showStartDatePicker = true;
		},

		prepareEndDatePicker() {
			if (!this.goalForm.startDate) {
				uni.showToast({ title: '请先选择开始日期', icon: 'none' });
				return;
			}
			const startDateTimestamp = new Date(this.goalForm.startDate).getTime();
			// 结束日期至少是开始日期当天
			this.minTimestampForEndDate = startDateTimestamp; 

			if (this.goalForm.endDate) {
				// 如果表单中已有结束日期，以此为准
				this.pickerEndDateTimestamp = new Date(this.goalForm.endDate).getTime();
				// 确保不早于minDate
				if (this.pickerEndDateTimestamp < this.minTimestampForEndDate) {
				    this.pickerEndDateTimestamp = this.minTimestampForEndDate;
				    this.goalForm.endDate = uni.$u.timeFormat(this.minTimestampForEndDate, 'yyyy-mm-dd'); // 如果调整了，也更新表单
				}
			} else {
				// 否则，默认结束日期选择器显示开始日期的后一天 (如果开始日期不是今天) 或当天 (如果开始日期是今天)
				// 为了简单，可以直接设为与开始日期相同，让用户自己去调整为未来
				this.pickerEndDateTimestamp = startDateTimestamp; 
				// this.goalForm.endDate = uni.$u.timeFormat(startDateTimestamp, 'yyyy-mm-dd'); // 可选：立即更新表单
			}
			// 再次确保 pickerEndDateTimestamp 不早于 minTimestampForEndDate (以防逻辑复杂性导致意外)
			if (this.pickerEndDateTimestamp < this.minTimestampForEndDate) {
				this.pickerEndDateTimestamp = this.minTimestampForEndDate;
			}
			this.showEndDatePicker = true;
		}
	}
}
</script>

<style lang="scss" scoped>
.budget-reminder {
	background-color: #f8f9fa;
	min-height: 100vh;
	padding-bottom: 40rpx;
}

.budget-section {
	.budget-usage {
		margin: 32rpx 0;
		padding: 24rpx;
		background-color: #f8f9fa;
		border-radius: 16rpx;
		
		.usage-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16rpx;
			
			.usage-title {
				font-size: 28rpx;
				color: #606266;
			}
			
			.usage-percent {
				font-size: 32rpx;
				font-weight: bold;
				color: #409eff;
			}
		}
		
		.usage-bar {
			height: 16rpx;
			background-color: #e4e7ed;
			border-radius: 8rpx;
			overflow: hidden;
			margin-bottom: 16rpx;
			
			.usage-progress {
				height: 100%;
				border-radius: 8rpx;
				transition: width 0.3s ease;
			}
		}
		
		.usage-info {
			display: flex;
			justify-content: space-between;
			font-size: 24rpx;
			color: #909399;
		}
	}
	
	.threshold-setting {
		width: 200rpx;
	}
}

.saving-goals {
	.no-goals {
		text-align: center;
		padding: 80rpx 0;
		color: #909399;
	}
	
	.goal-item {
		background-color: #f8f9fa;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-bottom: 24rpx;
		
		.goal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 16rpx;
			
			.goal-name {
				font-size: 32rpx;
				font-weight: bold;
				color: #303133;
			}
			
			.goal-status {
				font-size: 24rpx;
				color: #e6a23c;
				padding: 8rpx 16rpx;
				background-color: #fdf6ec;
				border-radius: 8rpx;
				
				&.completed {
					color: #67c23a;
					background-color: #f0f9ff;
				}
			}
		}
		
		.goal-progress {
			margin-bottom: 16rpx;
			
			.progress-info {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-bottom: 12rpx;
				
				.current {
					font-size: 28rpx;
					font-weight: bold;
					color: #409eff;
				}
				
				.target {
					font-size: 24rpx;
					color: #909399;
				}
			}
			
			.progress-bar {
				height: 16rpx;
				background-color: #e4e7ed;
				border-radius: 8rpx;
				overflow: hidden;
				margin-bottom: 12rpx;
				
				.progress-fill {
					height: 100%;
					background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
					border-radius: 8rpx;
					transition: width 0.3s ease;
				}
			}
			
			.progress-percent {
				text-align: center;
				font-size: 24rpx;
				color: #67c23a;
				font-weight: bold;
			}
		}
		
		.goal-dates {
			margin-bottom: 16rpx;
			
			.date-info {
				font-size: 24rpx;
				color: #909399;
			}
		}
		
		.goal-actions {
			display: flex;
			gap: 16rpx;
		}
	}
	
	.add-goal {
		margin-top: 32rpx;
	}
}

.section-right {
	display: flex;
	align-items: center;
}

.modal-content {
	padding: 20rpx 0;
}
</style> 