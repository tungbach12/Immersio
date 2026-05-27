import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  CheckCircle, 
  Star, 
  Layers, 
  Gamepad2, 
  UserCircle2, 
  Sparkles, 
  Mic, 
  Volume2, 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Send, 
  Mail, 
  ArrowRight, 
  Menu, 
  X, 
  Play, 
  Globe2, 
  Award,
  Brain,
  Activity,
  Sliders,
  Repeat,
  Check
} from 'lucide-react';

const Intro = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'phoneme' | 'cefr' | 'srs' | 'phrase'>('phoneme');

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Background Glowing Spots */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[150px] animate-pulse delay-1000" />
        <div className="absolute bottom-[10%] left-[20%] w-[45%] h-[45%] bg-indigo-600/10 rounded-full blur-[150px] animate-pulse delay-700" />
      </div>

      {/* Premium Translucent Navigation Bar */}
      <nav className="fixed top-0 w-full bg-slate-950/80 backdrop-blur-2xl z-50 border-b border-white/5 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02]">
            <div className="bg-white p-2 rounded-xl shadow-md border border-white/10">
              <img src="/logo.png" alt="IMMERSIO Logo" className="h-7 md:h-8 w-auto object-contain rounded-lg" />
            </div>
            <span className="font-black text-xl italic tracking-tighter text-white">IMMERSIO</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 font-extrabold text-slate-400 text-xs uppercase tracking-widest">
            <a href="#features" className="hover:text-indigo-400 transition-colors duration-200">AI Cognitive Core</a>
            <a href="#vn-mode" className="hover:text-indigo-400 transition-colors duration-200">Visual Novel Simulation</a>
            <a href="#spaced-repetition" className="hover:text-indigo-400 transition-colors duration-200">SRS Lab</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors duration-200">Sub Tiers</a>
          </div>

          <div className="flex items-center gap-2 md:gap-4 z-20">
            <Link to="/login" className="hidden sm:block text-slate-300 font-bold hover:text-indigo-400 transition-colors duration-200 text-xs uppercase tracking-wider px-4 py-2">
              Sign In
            </Link>
            <Link to="/register">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 md:px-6 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0">
                Launch Online Free
              </button>
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-slate-950 border-b border-white/5 shadow-2xl animate-in slide-in-from-top duration-300">
            <div className="flex flex-col p-6 gap-4 font-black uppercase text-[10px] tracking-widest text-slate-400">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="hover:text-indigo-400 py-3 border-b border-white/5">AI Cognitive Core</a>
              <a href="#vn-mode" onClick={() => setIsMenuOpen(false)} className="hover:text-indigo-400 py-3 border-b border-white/5">Visual Novel Simulation</a>
              <a href="#spaced-repetition" onClick={() => setIsMenuOpen(false)} className="hover:text-indigo-400 py-3 border-b border-white/5">SRS Lab</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="hover:text-indigo-400 py-3 border-b border-white/5">Sub Tiers</a>
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-3.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-colors">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                  Launch Online Free
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-44 pb-28 px-6 md:px-8 overflow-hidden z-10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-2 rounded-full text-xs font-bold mx-auto lg:mx-0 shadow-inner">
              <Zap size={14} className="animate-pulse" /> Voice-Interactive AI Language Learning
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight text-white italic uppercase">
              Speak to <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-400 pr-4">
                Conquer
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0 font-semibold">
              Học ngoại ngữ thông qua các tình huống nhập vai thực tế. Trò chuyện tự nhiên với nhân vật AI trong thế giới cốt truyện tương tác sống động, chấm điểm chuẩn xác đến từng nguyên âm, phụ âm bản xứ.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/register">
                <button className="group flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-indigo-600/30 transition duration-300 shadow-xl shadow-blue-500/10 w-full sm:w-auto hover:-translate-y-0.5">
                  Bắt đầu nói ngay 
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition duration-300">
                    <Mic size={14} className="text-cyan-300" />
                  </div>
                </button>
              </Link>
              <a href="#features">
                <button className="flex items-center justify-center gap-2 bg-white/5 text-slate-300 px-8 py-4.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 border border-white/10 transition duration-300 w-full sm:w-auto">
                  Khám phá lõi AI <Play size={10} fill="currentColor" />
                </button>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/5 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl md:text-3xl font-black text-blue-400">98%</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Chuẩn âm vị</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-indigo-400">100+</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Kịch bản nhập vai</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-cyan-400">CEFR</p>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Chẩn đoán cấp độ</p>
              </div>
            </div>
          </div>
          
          {/* Right Hero Side: Premium Dashboard/AI conversation interface Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-indigo-500 rounded-[2.5rem] blur-3xl opacity-20 transform -rotate-3 animate-pulse-slow"></div>
            
            {/* Premium Futuristic AI Voice Visual Asset */}
            <div className="relative z-10 bg-slate-900/40 backdrop-blur-2xl p-2.5 rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden transform lg:scale-105 transition-all duration-500 hover:scale-[1.07]">
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
              <img 
                src="/hero_voice_ai.png" 
                alt="IMMERSIO AI Voice Cognitive Core" 
                className="w-full h-auto object-cover rounded-[2rem] filter brightness-110 contrast-105"
              />
              
              {/* Overlay Premium Label */}
              <div className="absolute bottom-6 left-6 right-6 z-20 bg-slate-950/70 backdrop-blur-md border border-white/10 p-5 rounded-2xl">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">IMMERSIO Speech Lab</span>
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight italic">AI Voice Analysis Core</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Tự động nhận diện ngữ âm học, phản xạ ngôn ngữ đa nhánh và chẩn đoán cấp độ theo thang đo CEFR quốc tế.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Cognitive Core Grid Features section */}
      <section id="features" className="py-32 px-6 bg-slate-900/30 relative overflow-hidden border-t border-b border-white/5 z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-inner">
              Lõi phân tích AI bậc cao
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tight">AI Cognitive Core</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm font-semibold leading-relaxed">
              Trang bị các thuật toán chuyên sâu trên C# backend để chẩn đoán, tổng hợp kịch bản và tối ưu hóa phản xạ giao tiếp tự nhiên của học viên.
            </p>
          </div>

          {/* Feature Navigator Tab bar */}
          <div className="flex flex-wrap justify-center gap-3 mb-12 max-w-4xl mx-auto">
            {[
              { key: 'phoneme', label: 'Chẩn đoán âm vị', icon: <Mic size={14} /> },
              { key: 'cefr', label: 'Đánh giá CEFR', icon: <Award size={14} /> },
              { key: 'srs', label: 'Flashcard SRS', icon: <Brain size={14} /> },
              { key: 'phrase', label: 'Tổng hợp câu tự động', icon: <Sliders size={14} /> }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2.5 h-12 px-6 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all duration-300 active:scale-95 border ${
                  activeTab === tab.key 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30' 
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Interactive Feature Display Layout */}
          <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl max-w-5xl mx-auto">
            {activeTab === 'phoneme' && (
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                    <Mic size={24} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-none">Chấm điểm phát âm chi tiết âm vị</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                    Không chỉ nhận diện giọng nói đơn thuần. Hệ thống đo lường âm học so sánh chi tiết phát âm của bạn với dữ liệu bản xứ, chấm điểm chuẩn xác trên từng nguyên âm, phụ âm và âm tiết trong từ.
                  </p>
                  <ul className="space-y-3 font-semibold text-xs text-slate-300">
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <span>Hiển thị tỷ lệ chuẩn xác theo từng ký tự từ vựng.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <span>Chỉ ra các lỗi bỏ âm, đọc sai phụ âm gió phổ biến.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <span>Đánh giá ngữ điệu tổng quan của cả câu nói.</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Live Acoustics Analytics</h4>
                  <div className="space-y-4">
                    {[
                      { phone: "/d/", type: "Consonant", accuracy: 98, status: "Perfect" },
                      { phone: "/ʌ/", type: "Vowel", accuracy: 92, status: "Good" },
                      { phone: "/b/", type: "Consonant", accuracy: 96, status: "Perfect" },
                      { phone: "/l/", type: "Consonant", accuracy: 45, status: "Omitted" }
                    ].map((phone, idx) => (
                      <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-black text-indigo-400 w-10">{phone.phone}</span>
                          <div>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-tight block">{phone.type}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${phone.accuracy > 90 ? 'bg-emerald-500' : phone.accuracy > 70 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${phone.accuracy}%` }} />
                          </div>
                          <span className={`text-[10px] font-black uppercase ${phone.accuracy > 90 ? 'text-emerald-400' : phone.accuracy > 70 ? 'text-amber-400' : 'text-rose-400'}`}>{phone.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'cefr' && (
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                    <Award size={24} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-none">Chẩn đoán cấp độ giao tiếp CEFR</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                    Được tích hợp thuật toán phân tích hành vi ngôn ngữ. AI kiểm tra độ phức tạp của cú pháp bạn nói ra, dung lượng vốn từ tích cực, độ dài chuỗi phát ngôn và điểm số âm vị để xếp loại chuẩn mực CEFR.
                  </p>
                  <ul className="space-y-3 font-semibold text-xs text-slate-300">
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-indigo-400 shrink-0" />
                      <span>Xếp hạng từ A1 (Người mới) đến C2 (Thành thạo bản xứ).</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-indigo-400 shrink-0" />
                      <span>Tự động chấm điểm từ vựng tích cực (Active Vocab size).</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-indigo-400 shrink-0" />
                      <span>Tư vấn lộ trình bứt phá cải thiện ngữ âm học.</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">CEFR Diagnostics Report</h4>
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="w-28 h-28 rounded-full border-[8px] border-indigo-500/20 border-t-indigo-500 flex flex-col items-center justify-center relative shadow-lg shadow-indigo-500/10">
                      <span className="text-3xl font-black text-white leading-none">B2</span>
                      <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Upper-Int</span>
                    </div>
                    <h5 className="font-bold text-sm text-white mt-6">Professional Communicator</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Active Vocab: 1,240 words • Accuracy: 84%</p>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3 w-full mt-4 text-xs font-semibold text-indigo-300 italic">
                      "Hãy tập trung đa dạng hóa liên từ (conjunctions) và trạng từ để thăng hạng CEFR C1!"
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'srs' && (
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400">
                    <Brain size={24} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-none">Flashcard SRS & Trích xuất ngữ cảnh</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                    Không cần học chay từ vựng. Trí tuệ nhân tạo sẽ tự động rút trích các cụm từ bạn dùng sai cú pháp hoặc phát âm yếu trong buổi hội thoại, giải thích ngữ cảnh cặn kẽ và lưu vào thẻ ôn tập giãn cách SRS.
                  </p>
                  <ul className="space-y-3 font-semibold text-xs text-slate-300">
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-purple-400 shrink-0" />
                      <span>Rút trích riêng theo các chủ đề: Grammar, Vocab, Natural Rephrase.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-purple-400 shrink-0" />
                      <span>Phân bổ lịch trình ôn tập theo thuật toán trí nhớ SRS.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-purple-400 shrink-0" />
                      <span>Giải nghĩa bằng AI kèm theo ví dụ ứng dụng thực tiễn.</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-[2rem] p-6 shadow-2xl flex items-center justify-center">
                  {/* Premium Flashcard layout mockup */}
                  <div className="w-64 bg-slate-900 border border-white/15 rounded-3xl p-6 shadow-2xl hover:scale-105 transition transform duration-300 relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-xl" />
                    <div className="flex justify-between items-center pb-3 border-b border-white/5">
                      <span className="text-[8px] bg-purple-500/20 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded font-black uppercase tracking-widest">Grammar Core</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase">SRS Card #04</span>
                    </div>
                    <div className="py-6">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Context: Buying coffee</p>
                      <h4 className="text-sm font-black text-white mt-1 leading-snug">"I would like double espresso shot."</h4>
                      <p className="text-xs text-purple-400 font-extrabold mt-3">👉 "I would like a double espresso shot."</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 text-[9px] text-slate-400 leading-relaxed font-semibold">
                      💡 Cần thêm mạo từ "a" trước cụm danh từ số ít đếm được "double espresso shot".
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'phrase' && (
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
                    <Sliders size={24} />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-white uppercase italic leading-none">Bộ tổng hợp câu giao tiếp theo yêu cầu</h3>
                  <p className="text-sm text-slate-400 leading-relaxed font-semibold">
                    Muốn luyện tập một tình huống cực kỳ cụ thể? Chỉ cần chọn ngôn ngữ, cấp độ mong muốn và gõ chủ đề (ví dụ: "Thuyết trình báo cáo tại Tokyo"). AI sẽ lập tức tổng hợp bộ câu đối thoại chuẩn chỉnh để tập nói.
                  </p>
                  <ul className="space-y-3 font-semibold text-xs text-slate-300">
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-cyan-400 shrink-0" />
                      <span>Thiết lập linh hoạt ngôn ngữ và độ khó tương thích.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-cyan-400 shrink-0" />
                      <span>Hỗ trợ dịch nghĩa, phân tích văn phạm kèm giọng nói mẫu.</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle size={16} className="text-cyan-400 shrink-0" />
                      <span>Phù hợp chuẩn bị cấp tốc trước các buổi phỏng vấn, sự kiện.</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-[2rem] p-6 shadow-2xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">AI Instant Phrase Builder</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-900/80 border border-white/5 p-2 rounded-xl text-center">
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold">Language</span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase">Japanese</span>
                      </div>
                      <div className="bg-slate-900/80 border border-white/5 p-2 rounded-xl text-center">
                        <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold">CEFR Level</span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase">Intermediate</span>
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-white/5">
                      <span className="text-[8px] text-slate-500 uppercase tracking-wider block font-bold">User Topic</span>
                      <span className="text-xs font-black text-white mt-1 block">"Hâm nóng cơm bento ở cửa hàng tiện lợi..."</span>
                    </div>
                    <div className="bg-indigo-600/10 border border-indigo-500/20 p-3.5 rounded-xl">
                      <p className="text-[10px] font-bold text-indigo-400 leading-none">お弁当を温めていただけますか？</p>
                      <p className="text-[9px] text-slate-400 font-semibold mt-1.5">"Bạn có thể hâm nóng hộp cơm bento này giúp tôi được không?"</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Cinematic Visual Novel Simulator section */}
      <section id="vn-mode" className="py-28 px-6 bg-slate-950 overflow-hidden relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Premium Immersive Novel Story Portal Visual Asset */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-[2.5rem] blur-3xl opacity-20 transform rotate-6"></div>
              
              <div className="relative bg-slate-900/40 backdrop-blur-2xl p-2.5 rounded-[2.5rem] shadow-2xl border border-white/10 overflow-hidden">
                <div className="aspect-[16/10] relative bg-slate-950 rounded-[1.75rem] overflow-hidden border border-white/5">
                  <img 
                    src="/novel_portal_ai.png" 
                    alt="IMMERSIO Cinematic Story Portal" 
                    className="absolute inset-0 object-cover w-full h-full filter brightness-105 contrast-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent z-10 pointer-events-none" />
                  
                  {/* Floating Overlay Badge representing the Cinematic stories */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 bg-slate-950/80 backdrop-blur-md border border-white/5 p-4 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">2D Roleplay</span>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">• Multi-path Simulation</span>
                    </div>
                    <p className="text-[10px] text-slate-300 font-bold leading-relaxed">
                      Lựa chọn quyết định mạch truyện bằng giọng nói của chính bạn. Các ngã rẽ câu chuyện sẽ tự động biến đổi dựa theo nội dung bạn đối thoại.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Texts Info */}
            <div className="space-y-8 text-left lg:pl-6">
              <div className="inline-flex items-center gap-2 text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full shadow-inner">
                <Gamepad2 size={20} />
                <span className="font-extrabold uppercase tracking-wider text-xs">Mô phỏng nhập vai 2D</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight uppercase italic tracking-tight">
                Hội thoại cốt truyện<br />Bằng chính giọng nói của bạn
              </h2>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed font-semibold">
                Vượt xa các ứng dụng trắc nghiệm thông thường. Bạn chính là nhân vật chính của câu chuyện, quyết định các lối rẽ và hoàn thành thử thách giao tiếp bằng chính khẩu hình phát âm của bản thân.
              </p>
              
              <div className="grid gap-6">
                <div className="flex gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition duration-300">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-md text-blue-400 shrink-0">
                    <Mic size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Giao tiếp đa nhánh tự nhiên</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1.5 font-semibold">Nhân vật AI trả lời hoàn toàn tương thích và ngẫu biến dựa trên nội dung bạn nói.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-5 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition duration-300">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shadow-md text-indigo-400 shrink-0">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Gợi ý cách diễn đạt tự nhiên</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1.5 font-semibold">Nếu diễn đạt của bạn còn lủng củng, AI sẽ đề xuất cách nói chuẩn bản xứ (Dialogic Reformulation) ngay lập tức.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SRS Spaced Repetition detail section */}
      <section id="spaced-repetition" className="py-28 px-6 bg-slate-900/30 relative overflow-hidden border-t border-b border-white/5 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3.5 py-1.5 rounded-full shadow-inner">
                <Repeat size={18} />
                <span className="font-extrabold uppercase tracking-wider text-xs">Vòng lặp Spaced Repetition</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight uppercase italic tracking-tight">
                Học sâu nhớ lâu<br />Với thuật toán giãn cách SRS
              </h2>
              <p className="text-sm md:text-base text-slate-400 leading-relaxed font-semibold">
                Bất cứ cấu trúc sai ngữ pháp nào hay từ vựng mới nào bạn gặp phải trong kịch bản đều sẽ được phân tích, tạo thành thẻ ghi nhớ và được lên lịch ôn tập giãn cách một cách có khoa học để bám rễ sâu vào trí nhớ dài hạn.
              </p>
              
              <div className="flex gap-6 mt-8">
                <div className="flex-1 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-xl font-black text-white">4x</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mt-1">Tăng tốc ghi nhớ</span>
                </div>
                <div className="flex-1 p-5 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-xl font-black text-white">100%</span>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider block mt-1">Dựa trên ngữ cảnh thực</span>
                </div>
              </div>
            </div>

            <div className="relative flex justify-center">
              <div className="absolute inset-0 bg-purple-500/10 rounded-[2.5rem] blur-3xl opacity-30 transform -rotate-6"></div>
              
              <div className="relative bg-slate-900 border border-white/10 rounded-[3rem] p-8 w-full max-w-md shadow-2xl flex flex-col gap-6">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Spaced Repetition System (SRS)</h4>
                
                <div className="space-y-4">
                  {[
                    { label: "Card #01 (Chủ đề Cafe)", interval: "Review in 1 day", progress: 95 },
                    { label: "Card #02 (Chủ đề Lạc đường)", interval: "Review in 3 days", progress: 75 },
                    { label: "Card #03 (Chủ đề Phỏng vấn)", interval: "Review in 7 days", progress: 40 }
                  ].map((card, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white leading-none">{card.label}</p>
                        <span className="text-[8px] font-black text-purple-400 uppercase tracking-widest block mt-1.5">{card.interval}</span>
                      </div>
                      <div className="text-right">
                        <div className="w-16 bg-white/5 rounded-full h-1.5 overflow-hidden mb-1">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${card.progress}%` }} />
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{card.progress}% Mastered</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center">
                  <p className="text-[10px] text-purple-300 font-bold leading-relaxed">
                    🚀 Thuật toán thông minh sẽ đẩy các thẻ bạn phát âm yếu xuất hiện thường xuyên hơn, và giãn cách các thẻ bạn đã ghi nhớ tốt.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Subscription Pricing Tiers */}
      <section id="pricing" className="py-32 px-6 bg-slate-950 relative overflow-hidden z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-24 space-y-4">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-inner">
              Gói dịch vụ
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tight">Subscription Tiers</h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm font-semibold leading-relaxed">
              Lựa chọn hạn mức luyện tập phù hợp với nhu cầu phát triển năng lực phản xạ nói ngoại ngữ của bạn.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            
            {/* Tier 1: Basic */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 relative overflow-hidden group">
              <div>
                <h4 className="text-xl font-black text-white italic uppercase">Basic tier</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Luyện tập nền tảng</p>
                
                <div className="my-8 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">0đ</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">/ Free</span>
                </div>

                <ul className="space-y-4 pt-6 border-t border-white/5 text-xs text-slate-300 font-semibold">
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Hạn mức: 3 Kịch bản AI / ngày</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Lõi hội thoại phản xạ 2D cơ bản</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Giọng nói mẫu chuẩn tiêu chuẩn</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <X size={14} className="shrink-0" />
                    <span className="line-through">Phân tích chẩn đoán chi tiết âm vị</span>
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <X size={14} className="shrink-0" />
                    <span className="line-through">Chẩn đoán thăng hạng CEFR</span>
                  </li>
                </ul>
              </div>

              <Link to="/register" className="mt-10">
                <button className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all">
                  Get Started
                </button>
              </Link>
            </div>

            {/* Tier 2: Premium (Recommended) */}
            <div className="bg-gradient-to-b from-slate-900 to-indigo-950 border border-indigo-500/30 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-300 relative overflow-hidden group scale-100 md:scale-105 shadow-indigo-950/20">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl group-hover:scale-110 transition duration-500" />
              <div className="absolute top-4 right-4 bg-indigo-600 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-md">
                ⭐ Recommended
              </div>

              <div>
                <h4 className="text-xl font-black text-white italic uppercase">Premium tier</h4>
                <p className="text-[9px] text-indigo-400 font-black uppercase mt-1">Luyện tập tăng tốc</p>
                
                <div className="my-8 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">199.000đ</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">/ Tháng</span>
                </div>

                <ul className="space-y-4 pt-6 border-t border-white/5 text-xs text-slate-200 font-semibold">
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Hạn mức: 20 Kịch bản AI / ngày</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Mở khóa toàn bộ kho kịch bản VIP</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Giọng nói mẫu Neural Premium sống động</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Đánh giá phát âm âm vị chuẩn xác</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Thư viện ôn tập Flashcard SRS</span>
                  </li>
                </ul>
              </div>

              <Link to="/register" className="mt-10">
                <button className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-600/25 active:scale-95 transition-all">
                  Try Premium Now
                </button>
              </Link>
            </div>

            {/* Tier 3: Elite */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 shadow-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 relative overflow-hidden group">
              <div>
                <h4 className="text-xl font-black text-white italic uppercase">Elite tier</h4>
                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Bản lĩnh thượng lưu</p>
                
                <div className="my-8 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-white">499.000đ</span>
                  <span className="text-xs text-slate-500 font-bold uppercase">/ Tháng</span>
                </div>

                <ul className="space-y-4 pt-6 border-t border-white/5 text-xs text-slate-300 font-semibold">
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Hạn mức: Không giới hạn kịch bản</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Mở khóa toàn bộ kịch bản & Premium voices</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Chẩn đoán cấp độ nói chuẩn CEFR chuyên sâu</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Generative AI Phrase builder theo yêu cầu</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Check size={14} className="text-indigo-400 shrink-0" />
                    <span>Ưu tiên truy cập sớm tính năng AR/VR mới</span>
                  </li>
                </ul>
              </div>

              <Link to="/register" className="mt-10">
                <button className="w-full h-12 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest transition-all">
                  Go Elite
                </button>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Dynamic Call-To-Action (CTA) section */}
      <section className="py-28 px-6 bg-gradient-to-b from-indigo-950 to-slate-950 text-center relative overflow-hidden border-t border-white/5 z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent opacity-50"></div>
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight uppercase italic text-white">
            Sẵn sàng nhập vai để chinh phục giao tiếp?
          </h2>
          <p className="text-sm md:text-base text-slate-400 max-w-xl mx-auto font-semibold leading-relaxed">
            Trải nghiệm phương thức học ngoại ngữ hoàn toàn đột phá bằng công nghệ AI chẩn đoán âm thanh chi tiết nhất. Miễn phí cho người dùng đăng ký mới.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-10 h-14 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0 transition-all w-full sm:w-auto">
                Bắt đầu học Online Miễn phí
              </button>
            </Link>
            <Link to="/login">
              <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-10 h-14 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all w-full sm:w-auto">
                Đăng nhập với Google
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Dark Tech Footer */}
      <footer className="bg-slate-950 text-slate-400 pt-24 pb-12 px-6 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            {/* Column 1: Brand & Socials */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl w-fit border border-white/10">
                <img src="/logo.png" alt="IMMERSIO Logo" className="h-8 w-auto object-contain rounded-lg" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Ứng dụng học ngoại ngữ tiên phong áp dụng công nghệ Voice AI tiên tiến nhất, tạo dựng môi trường tự nhiên giúp học viên tự tin làm chủ ngôn ngữ giao tiếp.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 group">
                    <Icon size={16} className="group-hover:scale-110 transition duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Products */}
            <div>
              <h6 className="text-white font-bold uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-indigo-500"></div> Sản phẩm
              </h6>
              <ul className="space-y-4 text-xs font-semibold">
                {['Visual Novel Mode', 'AI Voice Analysis', 'Smart Flashcards', 'Scenario Library'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition flex items-center gap-2 group">
                      <ArrowRight size={10} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-indigo-400" /> {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h6 className="text-white font-bold uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-indigo-500"></div> Tài nguyên
              </h6>
              <ul className="space-y-4 text-xs font-semibold">
                {['Tài liệu hướng dẫn', 'Cộng đồng học thuật', 'Blog & Tin tức', 'Trung tâm hỗ trợ', 'Chương trình Beta'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition flex items-center gap-2 group">
                      <ArrowRight size={10} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-indigo-400" /> {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="space-y-8">
              <h6 className="text-white font-bold uppercase tracking-widest text-[10px] mb-8 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-indigo-500"></div> Bản tin
              </h6>
              <p className="text-xs text-slate-500 font-semibold">Đăng ký để nhận các kịch bản học tập mới nhất và ưu đãi sớm.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Email của bạn..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 transition shadow-inner font-semibold"
                />
                <button className="absolute right-1 top-1 bottom-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 rounded-lg transition-colors">
                  <Send size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-xs font-semibold">
                <Mail size={14} />
                <span>contact@immersio.edu.vn</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-600 text-xs font-semibold uppercase tracking-wider">
              © 2026 <span className="text-white">IMMERSIO</span>. All rights reserved.
            </p>
            <div className="flex gap-8 text-[11px] text-slate-600 font-black uppercase tracking-wider">
              <a href="#" className="hover:text-white transition">Chính sách bảo mật</a>
              <a href="#" className="hover:text-white transition">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-white transition">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes voice-wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2.2); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.28; transform: scale(1.03); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .animate-voice-wave {
          animation: voice-wave 1.2s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 6s ease-in-out infinite;
        }
        .shadow-glow {
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.25);
        }
      `}</style>
    </div>
  );
};

export default Intro;
