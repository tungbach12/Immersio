import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

/**
 * Privacy Policy — bắt buộc cho Google Play (Data Safety) và người dùng web.
 * URL: https://immersio.me/privacy
 */
const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm mb-8">
          <ArrowLeft size={16} /> Back to Immersio
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-indigo-400" size={28} />
          <h1 className="text-3xl font-black">Privacy Policy</h1>
        </div>
        <p className="text-slate-400 text-sm mb-10">Chính sách quyền riêng tư · Last updated: July 15, 2026</p>

        <div className="space-y-8 text-slate-300 leading-relaxed text-[15px]">
          <section>
            <h2 className="text-xl font-bold text-white mb-2">1. Who we are · Chúng tôi là ai</h2>
            <p>
              Immersio ("we", "us") is an AI-powered language learning platform available at{' '}
              <a href="https://immersio.me" className="text-indigo-400">https://immersio.me</a> and as the
              Immersio mobile app on Google Play. This policy explains what data we collect, why, and how
              you can control it. <span className="text-slate-400">— Immersio là nền tảng học ngoại ngữ bằng AI.
              Chính sách này giải thích dữ liệu nào được thu thập, vì sao, và cách bạn kiểm soát chúng.</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">2. Data we collect · Dữ liệu thu thập</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <b>Account information:</b> username, email address and a hashed password (we never store
                plain-text passwords). If you sign in with Google, we receive your name, email and avatar
                from Google. <span className="text-slate-400">— Thông tin tài khoản: tên, email, mật khẩu đã băm.</span>
              </li>
              <li>
                <b>Voice recordings:</b> when you use pronunciation practice or voice chat, your microphone
                audio is sent securely to our servers and to our AI speech-processing providers to be
                transcribed and scored. Audio is processed transiently; we store the resulting scores and
                text, not the raw audio. <span className="text-slate-400">— Bản ghi âm giọng nói chỉ được xử lý
                tạm thời để chấm điểm phát âm; chúng tôi lưu điểm số và văn bản, không lưu file ghi âm.</span>
              </li>
              <li>
                <b>Learning data:</b> flashcards, roleplay chat history, pronunciation scores, XP, streaks
                and study time. <span className="text-slate-400">— Dữ liệu học tập.</span>
              </li>
              <li>
                <b>Payment data:</b> if you upgrade, payments are processed by <b>PayOS</b>. We store the
                order reference and subscription status only — your card/bank details never reach our
                servers. <span className="text-slate-400">— Thanh toán do PayOS xử lý; chúng tôi không lưu
                thông tin thẻ/ngân hàng.</span>
              </li>
              <li>
                <b>Profile picture (optional):</b> stored via our image hosting provider (Cloudinary).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">3. How we use data · Mục đích sử dụng</h2>
            <p>
              We use your data solely to operate Immersio: authenticate you, generate AI conversations,
              assess pronunciation, track learning progress, process subscription payments, and send the
              notifications you opt into. We do <b>not</b> sell your personal data or use it for
              third-party advertising. <span className="text-slate-400">— Dữ liệu chỉ dùng để vận hành ứng dụng;
              không bán dữ liệu, không dùng cho quảng cáo bên thứ ba.</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">4. Sharing · Chia sẻ với bên thứ ba</h2>
            <p>
              Data is shared only with the service providers required to run Immersio: AI/LLM and speech
              processing providers (to power conversations and pronunciation scoring), Cloudinary (images),
              PayOS (payments) and Google (sign-in). Each receives only what is necessary for its function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">5. Security · Bảo mật</h2>
            <p>
              All traffic between the app/website and our servers is encrypted with HTTPS/TLS. Passwords
              are stored as salted hashes. On Android, session tokens are stored in encrypted storage
              (Android Keystore). <span className="text-slate-400">— Toàn bộ kết nối được mã hóa HTTPS; mật khẩu
              băm có muối; token phiên lưu trong bộ nhớ mã hóa của Android.</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">6. Data retention & deletion · Lưu trữ & xóa dữ liệu</h2>
            <p>
              Your data is kept while your account is active. You can permanently delete your account and
              all associated data at any time:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>In the mobile app: <b>Profile → Privacy &amp; Data → Delete Account</b>.</li>
              <li>
                On the web:{' '}
                <Link to="/delete-account" className="text-indigo-400 underline">
                  https://immersio.me/delete-account
                </Link>
              </li>
            </ul>
            <p className="mt-2">
              Deletion removes your profile, flashcards, chat history and pronunciation logs immediately.
              Payment transaction records are retained as required by financial/accounting law, but are
              disassociated from your identity. <span className="text-slate-400">— Xóa tài khoản sẽ xóa ngay hồ sơ
              và dữ liệu học; chứng từ thanh toán được giữ theo nghĩa vụ kế toán nhưng đã được ẩn danh hóa.</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">7. Children · Trẻ em</h2>
            <p>
              Immersio is not directed at children under 13. We do not knowingly collect data from children
              under 13; if you believe a child has provided us data, contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">8. Contact · Liên hệ</h2>
            <p>
              Questions or data requests: <a href="mailto:immerso@nextgenlab.com.vn" className="text-indigo-400">immerso@nextgenlab.com.vn</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-2">9. Changes · Thay đổi</h2>
            <p>
              We may update this policy; material changes will be announced in the app or on the website.
              Continued use after changes means you accept the updated policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
