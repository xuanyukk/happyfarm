/** * 文件名：RolesPage.vue * 作者：Trae AI * 日期：2026-04-30 * 版本：v1.0.0 *
功能描述：角色管理页面，提供角色列表查询、创建、编辑、删除和权限分配功能 *
更新记录： * 2026-04-30 - v1.0.0 - 初始版本创建 */
<template>
  <div class="roles-page">
    <div class="filter-bar">
      <div class="filter-group">
        <input
          v-model="filters.name"
          type="text"
          placeholder="搜索角色名"
          class="filter-input"
        />
        <select v-model="filters.isActive" class="filter-select">
          <option value="">全部状态</option>
          <option value="true">启用</option>
          <option value="false">禁用</option>
        </select>
      </div>
      <div class="filter-actions">
        <button class="btn btn-primary" @click="loadRoles">🔍 搜索</button>
        <button class="btn btn-default" @click="resetFilters">🔄 重置</button>
        <button class="btn btn-success" @click="openCreateModal">
          ➕ 创建角色
        </button>
      </div>
    </div>

    <div class="roles-table-container">
      <table class="roles-table">
        <thead>
          <tr>
            <th>角色ID</th>
            <th>角色名称</th>
            <th>描述</th>
            <th>用户数量</th>
            <th>权限数量</th>
            <th>系统内置</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="role in roles" :key="role.id">
            <td>{{ role.id }}</td>
            <td>{{ role.name }}</td>
            <td>{{ role.description || '-' }}</td>
            <td>{{ role.user_count || 0 }}</td>
            <td>{{ role.permission_count || 0 }}</td>
            <td>
              <span class="badge" :class="role.is_system ? 'system' : 'custom'">
                {{ role.is_system ? '是' : '否' }}
              </span>
            </td>
            <td>
              <span
                class="status-badge"
                :class="role.is_active ? 'active' : 'inactive'"
              >
                {{ role.is_active ? '启用' : '禁用' }}
              </span>
            </td>
            <td>{{ formatTime(role.created_at) }}</td>
            <td>
              <div class="action-buttons">
                <button
                  class="btn btn-small btn-info"
                  @click="viewDetail(role)"
                >
                  详情
                </button>
                <button
                  class="btn btn-small btn-warning"
                  @click="editRole(role)"
                >
                  编辑
                </button>
                <button
                  class="btn btn-small btn-primary"
                  @click="assignPermissions(role)"
                >
                  权限
                </button>
                <button
                  v-if="!role.is_system"
                  class="btn btn-small btn-danger"
                  @click="deleteRoleConfirm(role)"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button
        :disabled="pagination.page <= 1"
        class="btn btn-small"
        @click="changePage(pagination.page - 1)"
      >
        上一页
      </button>
      <span
        >第 {{ pagination.page }} / {{ pagination.totalPages }} 页，共
        {{ pagination.total }} 条</span
      >
      <button
        :disabled="pagination.page >= pagination.totalPages"
        class="btn btn-small"
        @click="changePage(pagination.page + 1)"
      >
        下一页
      </button>
    </div>

    <!-- 创建/编辑角色模态框 -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ isEditMode ? '编辑角色' : '创建角色' }}</h3>
          <button class="btn btn-small" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>角色名称 <span class="required">*</span></label>
            <input
              v-model="formData.name"
              type="text"
              class="form-input"
              placeholder="请输入角色名称"
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="formData.description"
              class="form-textarea"
              placeholder="请输入角色描述"
            ></textarea>
          </div>
          <div class="form-group">
            <label>父角色</label>
            <select v-model="formData.parent_id" class="form-select">
              <option value="">无</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">
                {{ r.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>
              <input v-model="formData.is_active" type="checkbox" />
              启用
            </label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closeModal">取消</button>
          <button class="btn btn-primary" :disabled="loading" @click="saveRole">
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 权限分配模态框 -->
    <div
      v-if="showPermissionModal"
      class="modal-overlay"
      @click.self="closePermissionModal"
    >
      <div class="modal permission-modal">
        <div class="modal-header">
          <h3>分配权限 - {{ selectedRole?.name }}</h3>
          <button class="btn btn-small" @click="closePermissionModal">
            &times;
          </button>
        </div>
        <div class="modal-body">
          <div class="permission-tree">
            <div
              v-for="node in permissionTree"
              :key="node.id"
              class="permission-node"
            >
              <div class="permission-item">
                <label class="permission-label">
                  <input
                    v-model="selectedPermissions"
                    type="checkbox"
                    :value="node.id"
                  />
                  <span class="permission-name">{{ node.name }}</span>
                  <span class="permission-code">({{ node.code }})</span>
                </label>
              </div>
              <div
                v-if="node.children && node.children.length > 0"
                class="permission-children"
              >
                <div
                  v-for="child in node.children"
                  :key="child.id"
                  class="permission-item"
                >
                  <label class="permission-label">
                    <input
                      v-model="selectedPermissions"
                      type="checkbox"
                      :value="child.id"
                    />
                    <span class="permission-name">{{ child.name }}</span>
                    <span class="permission-code">({{ child.code }})</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="closePermissionModal">
            取消
          </button>
          <button
            class="btn btn-primary"
            :disabled="loading"
            @click="savePermissions"
          >
            {{ loading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRbacStore } from '../../stores/rbac';

const rbacStore = useRbacStore();

const roles = ref([]);
const permissionTree = ref([]);
const selectedRole = ref(null);
const selectedPermissions = ref([]);
const loading = ref(false);
const showModal = ref(false);
const showPermissionModal = ref(false);
const isEditMode = ref(false);
const formData = ref({
  name: '',
  description: '',
  parent_id: null,
  is_active: true,
});
const filters = ref({
  name: '',
  isActive: '',
});
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0,
});

onMounted(() => {
  loadRoles();
  loadPermissionTree();
});

async function loadRoles() {
  try {
    await rbacStore.fetchRoles({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      name: filters.value.name || undefined,
      isActive: filters.value.isActive || undefined,
    });
    roles.value = rbacStore.roles;
    pagination.value = rbacStore.pagination;
  } catch (error) {
    alert(
      '加载角色列表失败: ' + (error.response?.data?.message || error.message)
    );
  }
}

async function loadPermissionTree() {
  try {
    await rbacStore.fetchPermissionTree();
    permissionTree.value = rbacStore.permissionTree;
  } catch (error) {
    alert(
      '加载权限树失败: ' + (error.response?.data?.message || error.message)
    );
  }
}

function resetFilters() {
  filters.value = {
    name: '',
    isActive: '',
  };
  pagination.value.page = 1;
  loadRoles();
}

function changePage(page) {
  pagination.value.page = page;
  loadRoles();
}

function viewDetail(role) {
  alert('查看角色详情: ' + role.name);
}

function openCreateModal() {
  isEditMode.value = false;
  formData.value = {
    name: '',
    description: '',
    parent_id: null,
    is_active: true,
  };
  showModal.value = true;
}

function editRole(role) {
  isEditMode.value = true;
  formData.value = {
    id: role.id,
    name: role.name,
    description: role.description,
    parent_id: role.parent_id,
    is_active: role.is_active,
  };
  showModal.value = true;
}

async function saveRole() {
  if (!formData.value.name) {
    alert('请输入角色名称');
    return;
  }

  try {
    loading.value = true;
    if (isEditMode.value) {
      await rbacStore.updateRole(formData.value.id, formData.value);
    } else {
      await rbacStore.createRole(formData.value);
    }
    showModal.value = false;
  } catch (error) {
    alert('保存角色失败: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
}

function closeModal() {
  showModal.value = false;
  formData.value = {
    name: '',
    description: '',
    parent_id: null,
    is_active: true,
  };
}

function deleteRoleConfirm(role) {
  if (confirm(`确定要删除角色"${role.name}"吗？`)) {
    deleteRole(role);
  }
}

async function deleteRole(role) {
  try {
    loading.value = true;
    await rbacStore.deleteRole(role.id, '删除角色');
  } catch (error) {
    alert('删除角色失败: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
}

async function assignPermissions(role) {
  selectedRole.value = role;
  selectedPermissions.value = [];

  try {
    const roleDetail = await rbacStore.fetchRoleDetail(role.id);
    if (roleDetail && roleDetail.permissions) {
      selectedPermissions.value = roleDetail.permissions.map((p) => p.id);
    }
    showPermissionModal.value = true;
  } catch (error) {
    alert(
      '获取角色权限失败: ' + (error.response?.data?.message || error.message)
    );
  }
}

async function savePermissions() {
  if (!selectedRole.value) {
    return;
  }

  try {
    loading.value = true;
    await rbacStore.assignRolePermissions(
      selectedRole.value.id,
      selectedPermissions.value
    );
    showPermissionModal.value = false;
    loadRoles();
  } catch (error) {
    alert('保存权限失败: ' + (error.response?.data?.message || error.message));
  } finally {
    loading.value = false;
  }
}

function closePermissionModal() {
  showPermissionModal.value = false;
  selectedRole.value = null;
  selectedPermissions.value = [];
}

function formatTime(timeStr) {
  if (!timeStr) return '-';
  const date = new Date(timeStr);
  return date.toLocaleString('zh-CN');
}
</script>

<style scoped>
.roles-page {
  padding: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filter-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 150px;
}

.filter-actions {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #409eff;
  color: white;
}

.btn-primary:hover {
  background: #66b1ff;
}

.btn-success {
  background: #67c23a;
  color: white;
}

.btn-success:hover {
  background: #85ce61;
}

.btn-warning {
  background: #e6a23c;
  color: white;
}

.btn-warning:hover {
  background: #ebb563;
}

.btn-danger {
  background: #f56c6c;
  color: white;
}

.btn-danger:hover {
  background: #f78989;
}

.btn-info {
  background: #409eff;
  color: white;
}

.btn-default {
  background: #909399;
  color: white;
}

.btn-default:hover {
  background: #a6a9ad;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.roles-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.roles-table {
  width: 100%;
  border-collapse: collapse;
}

.roles-table th,
.roles-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.roles-table th {
  background: #f5f7fa;
  font-weight: 600;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-badge.active {
  background: #e1f3d8;
  color: #67c23a;
}

.status-badge.inactive {
  background: #fef0f0;
  color: #f56c6c;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.badge.system {
  background: #ecf5ff;
  color: #409eff;
}

.badge.custom {
  background: #f4f4f5;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  padding: 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
}

.permission-modal {
  max-width: 700px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
}

.modal-body {
  padding: 20px;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

.required {
  color: #f56c6c;
}

.permission-tree {
  max-height: 400px;
  overflow-y: auto;
}

.permission-node {
  margin-bottom: 8px;
}

.permission-children {
  padding-left: 24px;
  margin-top: 4px;
}

.permission-item {
  padding: 4px 0;
}

.permission-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.permission-name {
  font-weight: 500;
}

.permission-code {
  color: #909399;
  font-size: 12px;
}
</style>
