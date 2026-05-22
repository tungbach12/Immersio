import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Zap, CheckCircle, Layers, Gamepad2, UserCircle2, Sparkles,
  Mic, Volume2, Facebook, Twitter, Instagram, Youtube,
  Send, Mail, ArrowRight, Menu, X, Play, Globe2, Award, Star
} from 'lucide-react';

const NM_RAISED = { boxShadow: '6px 6px 12px #D5C9B8, -6px -6px 12px #FFFFFF' } as const;
const NM_RAISED_LG = { boxShadow: '12px 12px 24px #D5C9B8, -12px -12px 24px #FFFFFF' } as const;
const NM_RAISED_XL = { boxShadow: '16px 16px 32px #D5C9B8, -16px -16px 32px #FFFFFF' } as const;
const NM_INSET = { boxShadow: 'inset 4px 4px 8px #D5C9B8, inset -4px -4px 8px #FFFFFF' } as const;
const NM_INSET_SM = { boxShadow: 'inset 2px 2px 4px #D5C9B8, inset -2px -2px 4px #FFFFFF' } as const;

const Intro = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDF6EC] text-[#3E2723] overflow-x-hidden" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>

      {/* ── Nav ── */}
      <nav
        className={`fixed top-0 w-full z-50 bg-[#FDF6EC] transition-all duration-400 ${scrolled ? 'py-3' : 'py-5'}`}
        style={scrolled ? { boxShadow: '0 2px 24px rgba(0,0,0,0.06)' } : {}}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="rounded-xl p-2" style={NM_RAISED}>
              <img src="/logo.png" alt="IMMERSIO" className="h-8 w-auto object-contain rounded-lg" />
            </div>
            <span className="text-xl font-normal text-[#8B5E3C]" style={{ fontFamily: "'Noto Serif Display', serif" }}>
              IMMERSIO
            </span>
          </Link>

          <div className="hidden md:flex gap-10 text-sm font-medium text-[#6D4C41]">
            <a href="#2d-mode" className="hover:text-[#8B5E3C] transition-colors duration-200">Visual Novel</a>
            <a href="#flow" className="hover:text-[#8B5E3C] transition-colors duration-200">Process</a>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login" className="hidden sm:block text-sm font-medium text-[#6D4C41] hover:text-[#8B5E3C] transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/onboarding">
              <button
                className="bg-[#8B5E3C] hover:bg-[#6B4226] text-white px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-300"
                style={NM_RAISED}
              >
                Get Started
              </button>
            </Link>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 text-[#6D4C41] hover:text-[#8B5E3C] transition">
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#FDF6EC]" style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <div className="flex flex-col p-6 gap-4 font-medium text-[#6D4C41]">
              <a href="#2d-mode" onClick={() => setIsMenuOpen(false)} className="hover:text-[#8B5E3C] py-2 border-b border-[#E8DDD0]">Visual Novel Mode</a>
              <a href="#flow" onClick={() => setIsMenuOpen(false)} className="hover:text-[#8B5E3C] py-2 border-b border-[#E8DDD0]">Process</a>
              <div className="flex flex-col gap-3 pt-2">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-3 rounded-xl border border-[#E8DDD0] text-[#6D4C41] hover:bg-[#FAF0E1] transition">Sign In</Link>
                <Link to="/onboarding" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full flex items-center justify-center py-3 rounded-xl bg-[#8B5E3C] text-white font-semibold">Get Started</button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-36 pb-24 px-6 md:px-10 overflow-hidden">
        {/* Ambient warmth */}
        <div className="absolute top-0 left-0 w-[50%] h-[60%] bg-[#C4956A]/8 rounded-full blur-[80px] -z-10" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[50%] bg-[#8B5E3C]/6 rounded-full blur-[80px] -z-10" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-10 items-center">

          {/* Left */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="lg:col-span-6 xl:col-span-5 space-y-7 text-center lg:text-left"
          >
            <div
              className="inline-flex items-center gap-2 bg-[#FAF0E1] text-[#8B5E3C] px-4 py-2 rounded-full text-xs font-semibold mx-auto lg:mx-0 tracking-wide"
              style={NM_RAISED}
            >
              <Zap size={12} fill="#8B5E3C" />
              Voice-Interactive AI · Language Learning
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-[4.2rem] lg:text-[4.8rem] leading-[1.05] text-[#3E2723]" style={{ fontFamily: "'Noto Serif Display', serif" }}>
              Nói để<br />
              <span style={{ color: '#8B5E3C' }}>Chinh Phục</span>
            </h1>

            <p className="text-[15px] text-[#6D4C41] leading-relaxed max-w-lg mx-auto lg:mx-0" style={{ fontWeight: 400 }}>
              Học ngoại ngữ thông qua các tình huống nhập vai thực tế. Trò chuyện tự nhiên với nhân vật AI trong thế giới cốt truyện tương tác sống động, giúp phản xạ giao tiếp tự nhiên.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/login">
                <button
                  className="flex items-center justify-center gap-3 bg-[#8B5E3C] hover:bg-[#6B4226] text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 w-full sm:w-auto"
                  style={NM_RAISED}
                >
                  Bắt đầu nói ngay <Mic size={14} />
                </button>
              </Link>
              <a href="#2d-mode">
                <button
                  className="flex items-center justify-center gap-2 bg-[#FDF6EC] hover:bg-[#FAF0E1] text-[#8B5E3C] px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 w-full sm:w-auto"
                  style={NM_RAISED}
                >
                  Khám phá <Play size={12} fill="currentColor" />
                </button>
              </a>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-5 border-t border-[#E8DDD0] max-w-md mx-auto lg:mx-0">
              {[
                { val: '98%', label: 'Phát âm chuẩn', color: '#8B5E3C' },
                { val: '200+', label: 'Kịch bản AI', color: '#C4956A' },
                { val: '10x', label: 'Phản xạ nhanh', color: '#8B5E3C' },
              ].map((m, i) => (
                <div key={i}>
                  <p className="text-2xl md:text-3xl font-normal" style={{ fontFamily: "'Noto Serif Display', serif", color: m.color }}>{m.val}</p>
                  <p className="text-[10px] font-semibold text-[#A0856A] uppercase tracking-wider mt-1">{m.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Chat card */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1], delay: 0.15 }}
            className="lg:col-span-6 xl:col-span-7 relative"
          >
            <div className="bg-[#FDF6EC] rounded-[1.5rem] p-6 flex flex-col gap-5" style={NM_RAISED_LG}>

              {/* Header */}
              <div className="flex justify-between items-center border-b border-[#E8DDD0] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#8B5E3C] flex items-center justify-center text-white" style={NM_RAISED}>
                    <Globe2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#3E2723] text-sm" style={{ fontFamily: "'Noto Serif Display', serif" }}>IMMERSIO Voice Room</h3>
                    <p className="text-[10px] text-[#A0856A] font-medium flex items-center gap-1.5 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                      Live AI Session
                    </p>
                  </div>
                </div>
                <span className="bg-[#F0E6D6] text-[#8B5E3C] text-[10px] font-semibold px-3 py-1.5 rounded-full" style={NM_INSET_SM}>
                  Level B2
                </span>
              </div>

              {/* Bubbles */}
              <div className="space-y-4">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="w-8 h-8 rounded-full bg-[#C4956A] flex items-center justify-center text-white shrink-0" style={{ boxShadow: '3px 3px 6px #D5C9B8, -3px -3px 6px #FFFFFF' }}>
                    <Sparkles size={13} />
                  </div>
                  <div className="bg-[#FAF0E1] p-3.5 rounded-2xl rounded-tl-none" style={NM_INSET}>
                    <p className="text-xs font-semibold text-[#8B5E3C] mb-1">Sofia (AI Coach)</p>
                    <p className="text-xs text-[#5D4037] leading-relaxed">"Great! Now let's try ordering your favorite coffee. How would you ask for a cold brew with oat milk?"</p>
                  </div>
                </div>

                <div className="flex gap-3 max-w-[85%] ml-auto justify-end">
                  <div className="bg-[#8B5E3C] text-white p-3.5 rounded-2xl rounded-tr-none" style={{ boxShadow: '4px 4px 10px #D5C9B8, -4px -4px 10px #FFFFFF' }}>
                    <p className="text-xs font-semibold text-[#F0D0A8] mb-1 text-right">You (Speaking)</p>
                    <p className="text-xs leading-relaxed">"I'd like a cold brew with oat milk, please!"</p>
                    <div className="flex items-center justify-end gap-[3px] mt-2.5">
                      {[1,2,3,4,5,4,3,2,1].map((v, i) => (
                        <span key={i} className="w-[2px] bg-white/70 rounded-full" style={{ height: `${v * 3}px`, animation: `voiceWave 1.2s ease-in-out ${i * 0.08}s infinite` }} />
                      ))}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#F0E6D6] flex items-center justify-center text-[#8B5E3C] shrink-0" style={{ boxShadow: '3px 3px 6px #D5C9B8, -3px -3px 6px #FFFFFF' }}>
                    <UserCircle2 size={15} />
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="bg-[#F0E6D6] p-4 rounded-xl flex items-center justify-between" style={NM_INSET}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#059669] text-white rounded-xl flex items-center justify-center" style={{ boxShadow: '3px 3px 8px rgba(5,150,105,0.3)' }}>
                    <Award size={18} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#3E2723] text-xs">Phát âm xuất sắc</h4>
                    <p className="text-[10px] text-[#A0856A] uppercase tracking-wider mt-0.5">Pronunciation</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-semibold text-[#059669]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>96%</p>
                  <span className="text-[9px] bg-[#DCFCE7] text-[#059669] px-2 py-0.5 rounded-full font-semibold">Perfect Tone</span>
                </div>
              </div>

              {/* Mic btn */}
              <div className="flex justify-center">
                <button
                  className="flex items-center gap-2.5 bg-[#FDF6EC] hover:bg-[#FAF0E1] text-[#8B5E3C] px-8 py-3 rounded-full font-semibold text-xs uppercase tracking-wider transition-all duration-300"
                  style={NM_RAISED}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <Mic size={13} /> Tap to Continue
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 2D Visual Novel ── */}
      <section id="2d-mode" className="py-28 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Game mockup */}
            <div className="relative">
              <div className="bg-[#FDF6EC] p-4 rounded-[1.5rem]" style={NM_RAISED_LG}>
                <div className="aspect-[16/9] relative bg-[#3E2723] rounded-xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800"
                    alt="Cafe Background"
                    className="absolute inset-0 object-cover opacity-40 w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#3E2723]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-60 bg-gradient-to-t from-[#8B5E3C]/20 to-transparent rounded-t-full flex items-end justify-center">
                    <div className="w-32 h-48 bg-white/10 backdrop-blur rounded-t-full flex items-center justify-center">
                      <UserCircle2 size={72} className="text-[#C4956A]/60 animate-pulse" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-[#3E2723]/95 backdrop-blur-xl p-4 rounded-xl border border-white/10">
                    <div className="absolute -top-3.5 left-4 bg-[#8B5E3C] text-white text-[9px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                      <Volume2 size={9} /> Sofia (Barista)
                    </div>
                    <p className="text-[#F0D0A8] text-[11px] leading-relaxed font-medium mb-3">
                      "Welcome back! Your usual Cappuccino, or would you like to try our special Christmas Latte today?"
                    </p>
                    <div className="bg-white/5 rounded-xl p-3 flex flex-col items-center gap-2.5">
                      <div className="flex items-center gap-[3px]">
                        {[1,2,3,4,5,4,3,2,1].map((v, i) => (
                          <div key={i} className="w-[2px] bg-[#C4956A] rounded-full" style={{ height: `${v * 2.5 + 4}px`, animation: `voiceWave 1.2s ease-in-out ${i * 0.08}s infinite` }} />
                        ))}
                      </div>
                      <button className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-full transition-all duration-300">
                        <Mic size={11} />
                        <span className="text-[9px] font-bold uppercase tracking-wider">Tap to Speak</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div
                className="absolute -top-4 -right-4 bg-[#FDF6EC] p-4 rounded-2xl flex items-center gap-3"
                style={{ ...NM_RAISED_LG, animation: 'floatBob 4s ease-in-out infinite' }}
              >
                <div className="w-8 h-8 bg-[#059669] rounded-full flex items-center justify-center text-white">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#A0856A] uppercase">Phát âm</p>
                  <span className="text-sm font-semibold text-[#3E2723]">Excellent! 98%</span>
                </div>
              </div>
            </div>

            {/* Text */}
            <div className="space-y-8 lg:pl-6">
              <div className="inline-flex items-center gap-2 bg-[#FAF0E1] text-[#8B5E3C] px-3.5 py-1.5 rounded-full" style={NM_RAISED}>
                <Gamepad2 size={16} />
                <span className="font-semibold uppercase tracking-wider text-xs">Chế độ 2D Visual Novel</span>
              </div>
              <h2 className="text-4xl md:text-5xl text-[#3E2723] leading-tight" style={{ fontFamily: "'Noto Serif Display', serif" }}>
                Hội thoại cốt truyện<br />
                <span style={{ color: '#8B5E3C' }}>Bằng giọng nói của bạn</span>
              </h2>
              <p className="text-[15px] text-[#6D4C41] leading-relaxed">
                Vượt xa các ứng dụng trắc nghiệm thông thường. Bạn chính là nhân vật chính, lựa chọn ngã rẽ bằng cách trực tiếp mở lời đàm thoại với AI.
              </p>
              <div className="grid gap-4">
                {[
                  { icon: <Mic size={18} />, title: "Giao tiếp đa nhánh tự nhiên", desc: "Cốt truyện mở rộng dựa theo cách bạn phản xạ và sử dụng từ ngữ." },
                  { icon: <Sparkles size={18} />, title: "Phân tích phát âm AI thông minh", desc: "AI đánh giá tức thời về ngữ điệu, phát âm và đề xuất cách cải thiện." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 bg-[#FDF6EC] rounded-xl hover:bg-[#FAF0E1] transition-all duration-300" style={NM_RAISED}>
                    <div className="w-11 h-11 bg-[#8B5E3C] rounded-xl flex items-center justify-center text-white shrink-0" style={NM_RAISED}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[#3E2723] text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-[#6D4C41] leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section id="flow" className="py-28 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <div className="inline-flex items-center gap-2 bg-[#FAF0E1] text-[#C4956A] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider" style={NM_RAISED}>
              Lộ trình học tối ưu
            </div>
            <h2 className="text-4xl text-[#3E2723]" style={{ fontFamily: "'Noto Serif Display', serif" }}>
              Quy trình Giao tiếp Tương tác
            </h2>
            <p className="text-[#6D4C41] max-w-lg mx-auto text-sm leading-relaxed">
              Phương pháp học tự nhiên, từ tiếp thu kịch bản đến giao tiếp thực tế và tối ưu hóa phát âm.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Chọn Kịch bản", desc: "Hàng trăm chủ đề đa dạng từ đời sống, công sở đến du lịch, được cập nhật liên tục bởi chuyên gia.", icon: <Layers size={22} /> },
              { title: "Giao tiếp & Đối thoại", desc: "Sử dụng giọng nói để tương tác trực tiếp với AI. Rèn luyện phản xạ, tạo tâm lý tự tin.", icon: <Mic size={22} /> },
              { title: "Đánh giá & Flashcard", desc: "AI chấm điểm chi tiết phát âm, tự động lưu từ vựng và cấu trúc sai để ôn tập.", icon: <Star size={22} /> },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: idx * 0.1 }}
                className="bg-[#FDF6EC] p-8 rounded-2xl relative"
                style={NM_RAISED_LG}
              >
                <div
                  className="absolute -top-4 -left-4 w-10 h-10 bg-[#3E2723] text-white rounded-xl flex items-center justify-center font-medium text-sm"
                  style={{ ...NM_RAISED, fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </div>
                <div className="w-14 h-14 bg-[#8B5E3C] text-white rounded-2xl flex items-center justify-center mb-6" style={NM_RAISED}>
                  {item.icon}
                </div>
                <h4 className="text-xl mb-3 text-[#3E2723]" style={{ fontFamily: "'Noto Serif Display', serif" }}>{item.title}</h4>
                <p className="text-[#6D4C41] leading-relaxed text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-[#FDF6EC] rounded-3xl py-16 px-8 text-center relative overflow-hidden" style={NM_RAISED_XL}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(196,149,106,0.07)_0%,transparent_100%)]" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-4xl md:text-5xl text-[#3E2723] leading-tight" style={{ fontFamily: "'Noto Serif Display', serif" }}>
                Sẵn sàng "nhập vai" để<br />
                <span style={{ color: '#8B5E3C' }}>làm chủ ngôn ngữ?</span>
              </h2>
              <p className="text-[15px] text-[#6D4C41] max-w-xl mx-auto leading-relaxed">
                Trải nghiệm phương thức học ngoại ngữ hoàn toàn mới thông qua cốt truyện đối thoại tương tác AI. Miễn phí trong giai đoạn beta.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Link to="/onboarding">
                  <button className="bg-[#8B5E3C] hover:bg-[#6B4226] text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 w-full sm:w-auto" style={NM_RAISED}>
                    Tải về bản Beta
                  </button>
                </Link>
                <Link to="/login">
                  <button className="bg-[#FDF6EC] hover:bg-[#FAF0E1] text-[#8B5E3C] px-8 py-4 rounded-xl font-semibold transition-all duration-300 w-full sm:w-auto" style={NM_RAISED}>
                    Bắt đầu học Online
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#3E2723] text-[#C4956A] pt-20 pb-12 px-6 md:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <div className="bg-[#FDF6EC] rounded-xl p-2.5 w-fit">
                <img src="/logo.png" alt="IMMERSIO" className="h-8 w-auto object-contain rounded-lg" />
              </div>
              <p className="text-sm text-[#A0856A] leading-relaxed">
                Ứng dụng học ngoại ngữ tiên phong áp dụng công nghệ Voice AI, tạo dựng môi trường tự nhiên giúp học viên làm chủ ngôn ngữ.
              </p>
              <div className="flex gap-3">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-9 h-9 rounded-xl bg-[#5D3A22] flex items-center justify-center hover:bg-[#8B5E3C] hover:text-white transition-all duration-300">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>
            {[
              { label: 'Sản phẩm', items: ['Visual Novel Mode', 'AI Voice Analysis', 'Smart Flashcards', 'Scenario Library'] },
              { label: 'Tài nguyên', items: ['Tài liệu hướng dẫn', 'Cộng đồng học thuật', 'Blog & Tin tức', 'Trung tâm hỗ trợ'] },
            ].map((col) => (
              <div key={col.label}>
                <h6 className="text-[#FDF6EC] font-semibold uppercase tracking-widest text-xs mb-7 flex items-center gap-2">
                  <div className="w-4 h-[1px] bg-[#C4956A]" /> {col.label}
                </h6>
                <ul className="space-y-4 text-sm">
                  {col.items.map(item => (
                    <li key={item}>
                      <a href="#" className="text-[#A0856A] hover:text-[#C4956A] transition-colors flex items-center gap-2 group">
                        <ArrowRight size={11} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div className="space-y-6">
              <h6 className="text-[#FDF6EC] font-semibold uppercase tracking-widest text-xs flex items-center gap-2">
                <div className="w-4 h-[1px] bg-[#C4956A]" /> Bản tin
              </h6>
              <p className="text-sm text-[#A0856A]">Đăng ký nhận kịch bản học mới nhất và ưu đãi sớm.</p>
              <div className="relative">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="w-full bg-[#5D3A22] border border-[#6B4226] rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-[#C4956A] text-[#FDF6EC] placeholder:text-[#A0856A]/60 transition"
                />
                <button className="absolute right-1 top-1 bottom-1 bg-[#8B5E3C] hover:bg-[#6B4226] text-white px-3.5 rounded-lg transition-colors font-semibold">
                  <Send size={14} />
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#A0856A]">
                <Mail size={13} className="text-[#C4956A]" />
                contact@immersio.edu.vn
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-[#5D3A22] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[#A0856A]">© 2026 <span className="text-[#FDF6EC] font-semibold">IMMERSIO</span>. All rights reserved.</p>
            <div className="flex gap-8 text-xs text-[#A0856A]">
              {['Chính sách bảo mật', 'Điều khoản sử dụng', 'Cookie Policy'].map(item => (
                <a key={item} href="#" className="hover:text-[#C4956A] transition">{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes voiceWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(2.6); }
        }
        @keyframes floatBob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
};

export default Intro;
