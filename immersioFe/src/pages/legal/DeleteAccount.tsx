import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ArrowLeft, AlertTriangle, CheckCircle } from 'lucide-react';
import { authService, API_BASE } from '../../services/auth';

/**
 * Trang yêu cầu xóa tài khoản — bắt buộc theo Google Play User Data policy:
 * người dùng phải xóa được tài khoản qua web mà không cần cài lại app.
 * URL: https://immersio.me/delete-account
 */
const DeleteAccount = () => {
  const loggedIn = !!authService.getAccessToken();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await authService.fetchWithAuth(`${API_BASE}/api/auth/me`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Xóa tài khoản thất bại, vui lòng thử lại.');
      authService.clearSession();
      setDone(true);
    } catch (e: any) {
      setError(e?.message || 'Xóa tài khoản thất bại, vui lòng thử lại.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm mb-8">
          <ArrowLeft size={16} /> Back to Immersio
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Trash2 className="text-red-400" size={28} />
          <h1 className="text-3xl font-black">Delete your account</h1>
        </div>
        <p className="text-slate-400 text-sm mb-10">Xóa tài khoản Immersio và toàn bộ dữ liệu</p>

        {done ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 flex items-start gap-3">
            <CheckCircle className="text-emerald-400 shrink-0 mt-1" size={22} />
            <div>
              <p className="font-bold text-emerald-300">Your account has been deleted.</p>
              <p className="text-slate-300 mt-1 text-sm">
                Tài khoản và toàn bộ dữ liệu của bạn đã được xóa vĩnh viễn. Cảm ơn bạn đã sử dụng Immersio.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8 text-slate-300 leading-relaxed text-[15px]">
            <section className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-red-400 shrink-0 mt-1" size={20} />
                <div>
                  <p className="font-bold text-white mb-2">What will be deleted · Dữ liệu sẽ bị xóa</p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>Your profile (username, email, avatar) — hồ sơ cá nhân</li>
                    <li>All flashcards and decks — toàn bộ flashcard</li>
                    <li>Roleplay chat history — lịch sử hội thoại</li>
                    <li>Pronunciation logs, XP, streaks — nhật ký phát âm, điểm kinh nghiệm</li>
                    <li>Active sessions on all devices — phiên đăng nhập trên mọi thiết bị</li>
                  </ul>
                  <p className="text-sm mt-3 text-slate-400">
                    Payment transaction records are retained (anonymized) as required by accounting law.
                    This action is <b className="text-red-300">permanent and cannot be undone</b>.
                    — Hành động này là vĩnh viễn, không thể hoàn tác.
                  </p>
                </div>
              </div>
            </section>

            {loggedIn ? (
              <section>
                <h2 className="text-lg font-bold text-white mb-3">Confirm deletion · Xác nhận xóa</h2>
                <p className="text-sm mb-3">
                  Type <b className="text-white">DELETE</b> to confirm — Gõ chữ <b className="text-white">DELETE</b> để xác nhận:
                </p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-red-400"
                />
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || deleting}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl px-6 py-3 transition"
                >
                  {deleting ? 'Deleting…' : 'Permanently delete my account'}
                </button>
              </section>
            ) : (
              <section>
                <h2 className="text-lg font-bold text-white mb-3">How to delete · Cách xóa</h2>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    <Link to="/login" className="text-indigo-400 underline">Sign in</Link> to your Immersio
                    account, then return to this page — a delete button will appear.
                    <span className="text-slate-400"> — Đăng nhập rồi quay lại trang này, nút xóa sẽ hiện ra.</span>
                  </li>
                  <li>
                    Or in the mobile app: <b>Profile → Privacy &amp; Data → Delete Account</b>.
                  </li>
                  <li>
                    If you can no longer access your account, email{' '}
                    <a href="mailto:immerso@nextgenlab.com.vn" className="text-indigo-400">
                      immerso@nextgenlab.com.vn
                    </a>{' '}
                    from your registered email address and we will delete your account within 7 days.
                    <span className="text-slate-400"> — Nếu không truy cập được tài khoản, gửi email từ địa chỉ
                    đã đăng ký, chúng tôi sẽ xóa trong vòng 7 ngày.</span>
                  </li>
                </ol>
              </section>
            )}

            <p className="text-sm text-slate-500">
              See also our <Link to="/privacy" className="text-indigo-400 underline">Privacy Policy</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeleteAccount;
