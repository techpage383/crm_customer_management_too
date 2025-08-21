/**
 * TODOルート定義
 * APIエンドポイント定義とミドルウェア設定
 * ★8 バックエンド実装エージェント担当
 */

import { Router } from 'express';
import { TodoController } from './todo.controller.js';
import { requireAuth, requireUpperRole } from '../auth/auth.middleware.js';
import { getAuthService } from '../auth/auth.service.js';

const router = Router();

// 認証サービス取得
const authService = getAuthService();

/**
 * TODO一覧取得・検索（GET）
 * GET /api/todos
 * 認証必須
 */
router.get('/', requireAuth(authService), (req, res) => {
  TodoController.searchTodos(req, res);
});

/**
 * TODO作成
 * POST /api/todos
 * 上位権限必須
 */
router.post('/', requireAuth(authService), requireUpperRole(authService), (req, res) => {
  TodoController.createTodo(req, res);
});

/**
 * TODO高度検索（POST）
 * POST /api/todos/search
 * 認証必須
 */
router.post('/search', requireAuth(authService), (req, res) => {
  TodoController.advancedSearchTodos(req, res);
});

/**
 * TODO統計情報取得
 * GET /api/todos/stats
 * 上位権限必須
 */
router.get('/stats', requireAuth(authService), requireUpperRole(authService), (req, res) => {
  TodoController.getTodoStats(req, res);
});

/**
 * 期限切れTODO取得
 * GET /api/todos/overdue
 * 認証必須
 */
router.get('/overdue', requireAuth(authService), (req, res) => {
  TodoController.getOverdueTodos(req, res);
});

/**
 * 今日期限TODO取得
 * GET /api/todos/today
 * 認証必須
 */
router.get('/today', requireAuth(authService), (req, res) => {
  TodoController.getTodayDueTodos(req, res);
});

/**
 * 承認待ちTODO取得
 * GET /api/todos/pending-approval
 * 上位権限必須
 */
router.get('/pending-approval', requireAuth(authService), requireUpperRole(authService), (req, res) => {
  TodoController.getPendingApprovalTodos(req, res);
});

/**
 * TODO CSV出力
 * GET /api/todos/export/csv
 * 上位権限必須
 */
router.get('/export/csv', requireAuth(authService), requireUpperRole(authService), (req, res) => {
  TodoController.exportTodosCSV(req, res);
});

/**
 * TODO一括更新
 * PUT /api/todos/bulk
 * 上位権限必須
 */
router.put('/bulk', requireAuth(authService), requireUpperRole(authService), (req, res) => {
  TodoController.bulkUpdateTodos(req, res);
});

/**
 * TODO詳細取得
 * GET /api/todos/:id
 * 認証必須
 */
router.get('/:id', requireAuth(authService), (req, res) => {
  TodoController.getTodoById(req, res);
});

/**
 * TODO更新
 * PUT /api/todos/:id
 * 上位権限必須
 */
router.put('/:id', requireAuth(authService), requireUpperRole(authService), (req, res) => {
  TodoController.updateTodo(req, res);
});

/**
 * TODO削除
 * DELETE /api/todos/:id
 * 上位権限必須
 */
router.delete('/:id', requireAuth(authService), requireUpperRole(authService), (req, res) => {
  TodoController.deleteTodo(req, res);
});

/**
 * TODO承認
 * PUT /api/todos/:id/approve
 * 上位権限必須
 */
router.put('/:id/approve', requireAuth(authService), requireUpperRole(authService), (req, res) => {
  TodoController.approveTodo(req, res);
});

export default router;