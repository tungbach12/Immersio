import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Zap, 
  CheckCircle, 
  ChevronRight,
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
  Award
} from 'lucide-react';

const Intro = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden selection:bg-blue-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/70 backdrop-blur-xl z-50 border-b border-slate-100/80 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group transition-transform duration-300 hover:scale-[1.02]">
            <img src="/logo.png" alt="IMMERSIO Logo" className="h-8 md:h-10 w-auto object-contain rounded-lg shadow-sm" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 font-semibold text-slate-600 text-sm tracking-wide">
            <a href="#2d-mode" className="hover:text-blue-600 transition-colors duration-200">Visual Novel Mode</a>
            <a href="#flow" className="hover:text-blue-600 transition-colors duration-200">Process</a>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/login" className="hidden sm:block text-slate-600 font-bold hover:text-blue-600 transition-colors duration-200 text-sm px-4 py-2 rounded-full hover:bg-slate-100/50">
              Sign In
            </Link>
            <Link to="/onboarding" className="hidden xs:block">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 md:px-6 py-2.5 rounded-full font-bold shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-xs md:text-sm">
                Download Beta
              </button>
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl animate-in slide-in-from-top duration-300">
            <div className="flex flex-col p-6 gap-4 font-bold text-slate-700">
              <a href="#2d-mode" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 py-2 border-b border-slate-50">Visual Novel Mode</a>
              <a href="#flow" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 py-2 border-b border-slate-50">Process</a>
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  Sign In
                </Link>
                <Link to="/onboarding" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200">
                  Download Beta
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-24 px-6 md:px-8 bg-gradient-to-b from-blue-50/50 via-white to-white overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 -z-10 animate-pulse-slow"></div>
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-purple-400/10 rounded-full blur-3xl -translate-y-1/2 -z-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-full text-xs md:text-sm font-bold mx-auto lg:mx-0 shadow-sm animate-fade-in">
              <Zap size={14} className="animate-pulse" /> Voice-Interactive AI Language Learning
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
              Nói để <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600">
                Chinh phục
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Học ngoại ngữ thông qua các tình huống nhập vai thực tế. Trò chuyện tự nhiên với nhân vật AI trong thế giới cốt truyện tương tác sống động, giúp phản xạ giao tiếp tự nhiên.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/login">
                <button className="group flex items-center justify-center gap-3 bg-slate-950 text-white px-8 py-4.5 rounded-2xl font-bold text-base hover:bg-slate-800 transition duration-300 shadow-xl shadow-slate-900/10 w-full sm:w-auto hover:shadow-2xl">
                  Bắt đầu nói ngay 
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition duration-300">
                    <Mic size={14} className="text-cyan-400" />
                  </div>
                </button>
              </Link>
              <a href="#2d-mode">
                <button className="flex items-center justify-center gap-2 bg-white text-slate-700 px-8 py-4.5 rounded-2xl font-bold text-base hover:bg-slate-50 border border-slate-200/80 transition duration-300 w-full sm:w-auto">
                  Khám phá kịch bản <Play size={14} fill="currentColor" />
                </button>
              </a>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-100 max-w-md mx-auto lg:mx-0">
              <div>
                <p className="text-2xl md:text-3xl font-black text-blue-600">98%</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phát âm chuẩn</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-indigo-600">200+</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kịch bản AI</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-black text-cyan-500">10x</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phản xạ nhanh</p>
              </div>
            </div>
          </div>
          
          {/* Right Hero Side: Premium Dashboard/AI conversation interface Mockup */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-indigo-500 rounded-[2.5rem] blur-3xl opacity-20 transform -rotate-6 animate-pulse-slow"></div>
            
            {/* Main Premium Mockup Frame */}
            <div className="relative z-10 bg-white/80 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl border border-white/60 flex flex-col gap-5 transform lg:scale-105 transition-all duration-500 hover:scale-[1.07] hover:rotate-1">
              
              {/* Top Bar / Header of Mockup */}
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
                    <Globe2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">IMMERSIO Voice Room</h3>
                    <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live AI Session
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full border border-slate-200">Level B2</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></div>
                </div>
              </div>

              {/* Chat Bubble Mockup */}
              <div className="space-y-4 my-2">
                {/* AI Bubble */}
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-400 to-cyan-500 flex items-center justify-center text-white shrink-0 shadow">
                    <Sparkles size={14} />
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl rounded-tl-none">
                    <p className="text-xs font-bold text-blue-600 mb-1">Sofia (AI Coach)</p>
                    <p className="text-xs text-slate-700 leading-relaxed">"Great! Now let's try ordering your favorite coffee. How would you ask for a cold brew with oat milk?"</p>
                  </div>
                </div>

                {/* User Speech Wave Bubble */}
                <div className="flex gap-3 max-w-[85%] ml-auto justify-end">
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-3.5 rounded-2xl rounded-tr-none shadow-lg shadow-blue-500/10">
                    <p className="text-xs font-bold text-cyan-300 mb-1 text-right">You (Speaking)</p>
                    <p className="text-xs leading-relaxed font-semibold">"I'd like a cold brew with oat milk, please!"</p>
                    
                    {/* Live Speech Wave animation */}
                    <div className="flex items-center justify-end gap-1 mt-2.5">
                      {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((val, idx) => (
                        <span 
                          key={idx} 
                          className="w-[2px] bg-white/80 rounded-full animate-voice-wave" 
                          style={{ height: `${val * 3}px`, animationDelay: `${idx * 0.08}s` }}
                        ></span>
                      ))}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white shrink-0 shadow">
                    <UserCircle2 size={16} />
                  </div>
                </div>
              </div>

              {/* Speech Analysis Widget */}
              <div className="bg-emerald-50/50 border border-emerald-100/80 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/10">
                    <Award size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">Phát âm xuất sắc</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pronunciation Accuracy</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600">96%</p>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Perfect Tone</span>
                </div>
              </div>

              {/* Microphone Interface button mockup */}
              <div className="flex justify-center pt-2">
                <button className="flex items-center gap-2.5 bg-rose-500 hover:bg-rose-600 text-white px-8 py-3 rounded-full font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-500/20 transition group">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  <Mic size={14} /> Tap to Continue
                </button>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* 2D Visual Novel Mode */}
      <section id="2d-mode" className="py-28 px-6 bg-white overflow-hidden border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Dialogue/Game Scene Mockup */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-100 rounded-[2.5rem] blur-3xl opacity-30 transform rotate-6"></div>
              <div className="relative bg-slate-950 p-4 rounded-[2.5rem] shadow-2xl border-[10px] border-slate-900 overflow-hidden">
                
                {/* Game Scene Frame */}
                <div className="aspect-[16/9] relative bg-slate-900 rounded-[1.5rem] overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800" 
                    alt="Cafe Background" 
                    className="absolute inset-0 object-cover opacity-40 w-full h-full"
                  />
                   
                  {/* Visual Novel Character */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-64 bg-gradient-to-t from-blue-500/20 to-transparent rounded-t-full flex items-end justify-center">
                    <div className="w-36 h-52 bg-white/10 backdrop-blur-lg rounded-t-full border-t-[3px] border-white/20 flex items-center justify-center shadow-inner">
                      <UserCircle2 size={80} className="text-cyan-400 opacity-80 animate-pulse" />
                    </div>
                  </div>

                  {/* VN Dialogue Box */}
                  <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                    <div className="absolute -top-3.5 left-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <Volume2 size={10} /> Sofia (Barista)
                    </div>
                    <p className="text-white text-[11px] leading-relaxed font-medium mb-3">
                      "Welcome back! Your usual Cappuccino, or would you like to try our special Christmas Latte today?"
                    </p>
                    
                    {/* Integrated Voice UI */}
                    <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex flex-col items-center justify-center gap-2.5">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((v, i) => (
                          <div 
                            key={i} 
                            className="w-[2px] bg-cyan-400 rounded-full animate-voice-wave" 
                            style={{ height: `${v * 2.5 + 4}px`, animationDelay: `${i * 0.08}s` }}
                          ></div>
                        ))}
                      </div>
                      <button className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-5 py-2 rounded-full transition-all duration-300 relative group">
                        <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-15"></div>
                        <Mic size={12} className="group-hover:scale-110 transition" />
                        <span className="text-[9px] font-black uppercase tracking-wider">Tap to Speak...</span>
                      </button>
                      <p className="text-[9px] text-slate-400 italic">"I'd like to try the Christmas Latte, please!"</p>
                    </div>
                  </div>
                </div>

              </div>
              
              {/* Floating Accuracy Tag */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100/80 flex items-center gap-3 animate-bounce-slow">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Phát âm</p>
                  <span className="text-sm font-black text-slate-800">Excellent! 98%</span>
                </div>
              </div>
            </div>

            {/* Left Texts Info */}
            <div className="space-y-8 text-left lg:pl-6">
              <div className="inline-flex items-center gap-2 text-blue-600 bg-blue-50 px-3.5 py-1.5 rounded-full">
                <Gamepad2 size={20} />
                <span className="font-extrabold uppercase tracking-wider text-xs">Chế độ 2D Visual Novel</span>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 leading-tight">
                Hội thoại cốt truyện<br />Bằng chính giọng nói của bạn
              </h2>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                Vượt xa các ứng dụng trắc nghiệm thông thường. Bạn chính là nhân vật chính của câu chuyện, lựa chọn ngã rẽ và phát triển kịch bản bằng cách trực tiếp mở lời đàm thoại.
              </p>
              
              <div className="grid gap-6">
                <div className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-blue-50/30 transition duration-300">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 shrink-0 border border-slate-100">
                    <Mic size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Giao tiếp đa nhánh tự nhiên</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">Cốt truyện mở rộng dựa theo cách bạn phản xạ và sử dụng từ ngữ của mình.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:bg-purple-50/30 transition duration-300">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-purple-600 shrink-0 border border-slate-100">
                    <Sparkles size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Phân tích phát âm AI thông minh</h4>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">AI đánh giá tức thời về ngữ điệu, phát âm và đề xuất cách cải thiện tự nhiên nhất.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section id="flow" className="py-28 px-6 bg-slate-100/50 relative overflow-hidden border-y border-slate-200/50">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Lộ trình học tối ưu
            </div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Quy trình Giao tiếp Tương tác</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
              Phương pháp học tự nhiên, đi từ tiếp thu kịch bản đến giao tiếp thực tế và tối ưu hóa phát âm.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Chọn Kịch bản",
                desc: "Hàng trăm chủ đề đa dạng từ đời sống, công sở đến du lịch, được cập nhật liên tục bởi chuyên gia bản xứ.",
                icon: <Layers size={24} />
              },
              {
                title: "Giao tiếp & Đối thoại",
                desc: "Sử dụng giọng nói để tương tác trực tiếp với AI. Rèn luyện phản xạ không lo ngại, tạo tâm lý tự tin.",
                icon: <Mic size={24} />
              },
              {
                title: "Đánh giá & Flashcard",
                desc: "AI chấm điểm chi tiết phát âm từng từ, tự động lưu trữ cấu trúc sai và từ vựng mới để ôn tập.",
                icon: <Star size={24} />
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-8 rounded-[2.2rem] hover:shadow-xl transition duration-300 group relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-slate-950 text-white rounded-2xl flex items-center justify-center font-bold text-sm shadow-lg">
                  {idx + 1}
                </div>
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition duration-300">
                  {item.icon}
                </div>
                <h4 className="text-xl font-bold mb-3 text-slate-900 uppercase tracking-tight">{item.title}</h4>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-24 px-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50"></div>
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tight">
            Sẵn sàng "nhập vai" để làm chủ ngôn ngữ ngay hôm nay?
          </h2>
          <p className="text-lg text-blue-100 max-w-xl mx-auto">
            Trải nghiệm phương thức học ngoại ngữ hoàn toàn mới thông qua cốt truyện đối thoại tương tác AI. Miễn phí cho giai đoạn thử nghiệm beta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/onboarding">
              <button className="bg-white text-blue-700 hover:bg-slate-50 px-8 py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition duration-300 w-full sm:w-auto">
                Tải về bản thử nghiệm Beta
              </button>
            </Link>
            <Link to="/login">
              <button className="bg-slate-950 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold transition duration-300 w-full sm:w-auto">
                Bắt đầu học Online
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="bg-slate-950 text-slate-200 pt-24 pb-12 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            {/* Column 1: Brand & Socials */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl w-fit">
                <img src="/logo.png" alt="IMMERSIO Logo" className="h-8 w-auto object-contain rounded-lg" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ứng dụng học ngoại ngữ tiên phong áp dụng công nghệ Voice AI tiên tiến nhất, tạo dựng môi trường tự nhiên giúp học viên tự tin làm chủ ngôn ngữ giao tiếp.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center border border-white/5 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 group">
                    <Icon size={18} className="group-hover:scale-110 transition duration-300" />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Products */}
            <div>
              <h6 className="text-white font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-blue-500"></div> Sản phẩm
              </h6>
              <ul className="space-y-4 text-sm text-slate-400">
                {['Visual Novel Mode', 'AI Voice Analysis', 'Smart Flashcards', 'Scenario Library'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-blue-400 transition flex items-center gap-2 group">
                      <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div>
              <h6 className="text-white font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-blue-500"></div> Tài nguyên
              </h6>
              <ul className="space-y-4 text-sm text-slate-400">
                {['Tài liệu hướng dẫn', 'Cộng đồng học thuật', 'Blog & Tin tức', 'Trung tâm hỗ trợ', 'Chương trình Beta'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-blue-400 transition flex items-center gap-2 group">
                      <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" /> {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="space-y-8">
              <h6 className="text-white font-bold uppercase tracking-widest text-xs mb-8 flex items-center gap-2">
                <div className="w-4 h-[1px] bg-blue-500"></div> Bản tin
              </h6>
              <p className="text-sm text-slate-400">Đăng ký để nhận các kịch bản học tập mới nhất và ưu đãi sớm.</p>
              <div className="relative">
                <input 
                  type="email" 
                  placeholder="Email của bạn..." 
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 transition shadow-inner"
                />
                <button className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-500 text-white px-3.5 rounded-lg transition-colors">
                  <Send size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-slate-500">
                <Mail size={16} />
                <span className="text-xs">contact@immersio.edu.vn</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">
              © 2026 <span className="text-white">IMMERSIO</span>. All rights reserved.
            </p>
            <div className="flex gap-8 text-xs text-slate-500 font-medium">
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
          50% { transform: translateY(-10px); }
        }
        @keyframes voice-wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2.5); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.05); }
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
      `}</style>
    </div>
  );
};

export default Intro;
