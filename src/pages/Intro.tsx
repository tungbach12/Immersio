import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Camera, 
  Cpu, 
  Users, 
  MessageSquare, 
  Zap, 
  CheckCircle, 
  Smartphone, 
  Globe, 
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
  X
} from 'lucide-react';

const Intro = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const team = [
    { name: "Trần Hải Đăng", role: "Leader & Research", color: "from-blue-400 to-blue-600" },
    { name: "Trần Tùng Bách", role: "Game Logic & AI System", color: "from-purple-400 to-purple-600" },
    { name: "Lữ Anh Bảo Khang", role: "Interface & Interaction", color: "from-cyan-400 to-cyan-600" },
    { name: "Ngô Đức Long", role: "UI/UX & Visuals", color: "from-indigo-400 to-indigo-600" },
    { name: "Lê Hoàng Phúc", role: "Marketing & Finance", color: "from-pink-400 to-pink-600" },
    { name: "Nguyễn Đạo Thiện", role: "Data & Performance", color: "from-teal-400 to-teal-600" }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="IMMERSIO Logo" className="h-8 md:h-10 w-auto object-contain rounded-lg" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 font-medium text-slate-600 text-sm">
            <a href="#ar-feature" className="hover:text-blue-600 transition">AR Tech</a>
            <a href="#2d-mode" className="hover:text-blue-600 transition">Visual Novel Mode</a>
            <a href="#flow" className="hover:text-blue-600 transition">Process</a>
            <a href="#team" className="hover:text-blue-600 transition">Team</a>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/login" className="hidden sm:block text-slate-600 font-bold hover:text-blue-600 transition text-sm">
              Sign In
            </Link>
            <Link to="/onboarding" className="hidden xs:block">
              <button className="bg-blue-600 text-white px-4 md:px-5 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition transform hover:scale-105 active:scale-95 text-xs md:text-sm">
                Download Beta
              </button>
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white border-b border-slate-100 shadow-xl animate-in slide-in-from-top duration-300">
            <div className="flex flex-col p-6 gap-4 font-bold text-slate-700">
              <a href="#ar-feature" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 py-2 border-b border-slate-50">AR Tech</a>
              <a href="#2d-mode" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 py-2 border-b border-slate-50">Visual Novel Mode</a>
              <a href="#flow" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 py-2 border-b border-slate-50">Process</a>
              <a href="#team" onClick={() => setIsMenuOpen(false)} className="hover:text-blue-600 py-2 border-b border-slate-50">Team</a>
              <div className="flex flex-col gap-3 pt-4">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-3 rounded-xl border border-slate-200 text-slate-600">
                  Sign In
                </Link>
                <Link to="/onboarding" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center py-3 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                  Download Beta
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold border border-blue-100 mx-auto lg:mx-0">
              <Zap size={16} /> Hybrid Learning: Voice-Interactive AR & 2D
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] text-slate-900 text-balance">
              Nói để <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600">
                Chinh phục
              </span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Học ngoại ngữ bằng cách <b>nói chuyện trực tiếp</b> với AI trong môi trường AR sống động hoặc chế độ cốt truyện Visual Novel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/login">
                <button className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition shadow-xl w-full sm:w-auto">
                  Bắt đầu nói ngay <Mic size={20} />
                </button>
              </Link>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-cyan-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative z-10 bg-white p-8 rounded-[2.5rem] shadow-2xl border border-white/50 backdrop-blur-sm transform rotate-2 flex items-center justify-center">
              <img 
                src="/logo.png" 
                alt="IMMERSIO Logo" 
                className="w-full max-w-[300px] h-auto object-contain rounded-3xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AR Feature Spotlight */}
      <section id="ar-feature" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black italic tracking-tight">Trải nghiệm AR Thực tế</h2>
            <div className="h-1.5 w-24 bg-cyan-400 mx-auto rounded-full"></div>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Đưa nhân vật ảo vào không gian thật để thực hành giao tiếp trực quan nhất.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-cyan-400 transition group">
              <div className="w-14 h-14 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition">
                <Camera size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-cyan-400">Giao tiếp Không gian</h3>
              <p className="text-slate-400">
                Nhân vật AI xuất hiện ngay trong căn phòng của bạn, tạo môi trường học tập thực tế 100%.
              </p>
            </div>

            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-blue-400 transition group scale-105 shadow-2xl z-10">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition">
                <Smartphone size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-blue-400">Nhận diện Đồ vật</h3>
              <p className="text-slate-400">
                Tương tác với đồ vật thực xung quanh để học từ vựng và cấu trúc câu liên quan đến đời thực.
              </p>
            </div>

            <div className="bg-slate-800/50 p-8 rounded-3xl border border-slate-700 hover:border-indigo-400 transition group">
              <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 transition">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-indigo-400">AI Role-play</h3>
              <p className="text-slate-400">
                Đóng vai trong các tình huống thực tế và nhận phản hồi tức thì về phát âm của bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* RE-IMAGINED: 2D Visual Novel Mode with VOICE INTERACTION */}
      <section id="2d-mode" className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="bg-slate-900 p-4 rounded-[2.5rem] shadow-2xl border-[8px] border-slate-800 overflow-hidden relative">
                {/* Game Scene Mockup */}
                <div className="aspect-[16/9] relative bg-blue-100 rounded-[1.5rem] overflow-hidden">
                   <img 
                      src="https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&q=80&w=800" 
                      alt="Cafe Background" 
                      className="absolute inset-0 object-cover opacity-60"
                   />
                   
                   {/* NPC Character */}
                   <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-64 bg-gradient-to-t from-blue-400 to-transparent rounded-t-full flex items-end justify-center animate-pulse">
                      <div className="w-40 h-56 bg-white/40 backdrop-blur-md rounded-t-full border-t-4 border-white flex items-center justify-center">
                         <UserCircle2 size={80} className="text-blue-600 opacity-60" />
                      </div>
                   </div>

                   {/* Game Dialogue Box - UPDATED for Voice */}
                   <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-2xl">
                      <div className="absolute -top-6 left-4 bg-blue-600 text-white text-[10px] font-black px-4 py-1 rounded-t-lg uppercase tracking-widest flex items-center gap-2">
                         <Volume2 size={10} /> Sofia (Barista)
                      </div>
                      <p className="text-white text-[12px] leading-relaxed font-medium mb-4">
                         "Welcome back! Your usual Cappuccino, or would you like to try our special Christmas Latte today?"
                      </p>
                      
                      {/* VOICE INPUT UI */}
                      <div className="bg-white/5 rounded-lg p-3 border border-white/5 flex flex-col items-center justify-center gap-3">
                        <div className="flex items-center gap-1">
                          {[1,2,3,4,5].map(i => (
                            <div key={i} className="w-1 bg-cyan-400 rounded-full animate-voice-wave" style={{ height: `${Math.random() * 15 + 5}px`, animationDelay: `${i * 0.1}s` }}></div>
                          ))}
                        </div>
                        <button className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full transition group relative">
                           <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
                           <Mic size={14} className="group-hover:scale-110 transition" />
                           <span className="text-[10px] font-black uppercase tracking-wider">Tap to Speak your answer...</span>
                        </button>
                        <p className="text-[9px] text-slate-400 italic">"I'd like to try the Christmas Latte, please!"</p>
                      </div>
                   </div>
                </div>
              </div>
              
              {/* Floating Feedback Tag */}
              <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-bounce-slow">
                 <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shadow-inner">
                    <CheckCircle size={16} />
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase">Pronunciation</p>
                   <span className="text-sm font-black text-slate-800">Excellent! 98%</span>
                 </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-8 text-balance">
              <div className="flex items-center gap-3 text-blue-600">
                <Gamepad2 size={32} />
                <span className="font-black uppercase tracking-[0.2em] text-sm">Chế độ 2D</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 italic">Đối thoại trực tiếp<br />Bằng Giọng nói</h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Quên đi việc bấm nút chọn đáp án. Trong IMMERSIO, bạn phải thực sự <b>mở lời</b> để tiếp tục cốt truyện.
              </p>
              
              <div className="grid gap-6">
                <div className="flex gap-4 p-5 bg-blue-50 rounded-3xl border border-blue-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-blue-600 shrink-0">
                    <Mic size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">Speech-to-Game Interaction</h4>
                    <p className="text-sm text-slate-600">Hệ thống nhận diện giọng nói cực nhạy, giúp bạn điều khiển mạch truyện bằng ngôn ngữ.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-5 bg-purple-50 rounded-3xl border border-purple-100">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-purple-600 shrink-0">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">AI Feedback Chuyên sâu</h4>
                    <p className="text-sm text-slate-600">Phân tích âm sắc, nhịp điệu và ngữ pháp ngay sau mỗi câu thoại bạn vừa nói.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process */}
      <section id="flow" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl font-black text-slate-900 italic">Lộ trình Học tập Tối ưu</h2>
            <p className="text-slate-500">Quy trình đơn giản nhưng mang lại hiệu quả vượt trội.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Chọn Kịch bản",
                desc: "Hệ thống gợi ý cốt truyện dựa trên trình độ và sở thích cá nhân của bạn.",
                icon: <Layers />
              },
              {
                title: "Giao tiếp AI",
                desc: "Sử dụng giọng nói để đối thoại với nhân vật, rèn luyện phản xạ ngôn ngữ tức thì.",
                icon: <Mic />
              },
              {
                title: "Phân tích Kết quả",
                desc: "Nhận đánh giá chi tiết về phát âm và lưu trữ từ vựng mới vào Flashcards.",
                icon: <Star />
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] hover:shadow-2xl transition duration-500 group relative">
                 <div className="absolute -top-4 -left-4 w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black italic shadow-xl">
                   0{idx+1}
                 </div>
                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:rotate-12 transition">
                  {item.icon}
                </div>
                <h4 className="text-xl font-black mb-4 uppercase tracking-tighter">{item.title}</h4>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section id="team" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4 italic">Đội ngũ phát triển</h2>
            <p className="text-slate-500 uppercase tracking-widest font-bold text-xs">Cutie Patootie Team</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {team.map((member, idx) => (
              <div key={idx} className="text-center group">
                <div className={`w-full aspect-square rounded-3xl bg-gradient-to-br ${member.color} mb-4 shadow-lg group-hover:scale-105 transition duration-300 flex items-center justify-center text-white`}>
                  <Users size={40} />
                </div>
                <h5 className="font-bold text-slate-900 leading-tight text-sm">{member.name}</h5>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-tighter">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROFESSIONAL FOOTER UPDATED */}
      <footer className="bg-slate-950 text-slate-200 pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
            {/* Column 1: Brand & Socials */}
            <div className="space-y-8">
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl w-fit">
                <img src="/logo.png" alt="IMMERSIO Logo" className="h-8 w-auto object-contain rounded-lg" />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Ứng dụng học ngôn ngữ tiên phong sử dụng AR & Voice AI để xóa nhòa khoảng cách giữa học tập và thực tế. Chúng tôi giúp bạn "sống" trong ngôn ngữ.
              </p>
              <div className="flex gap-4">
                {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-white/5 hover:bg-blue-600 hover:text-white transition-all duration-300 group">
                    <Icon size={18} className="group-hover:scale-110 transition" />
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
                {['AR World Experience', 'Visual Novel Mode', 'AI Voice Analysis', 'Smart Flashcards', 'Scenario Library'].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-blue-400 transition flex items-center gap-2 group">
                      <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /> {item}
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
                      <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" /> {item}
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
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition shadow-inner"
                />
                <button className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition">
                  <Send size={18} />
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
            <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">
              © 2024 <span className="text-white">IMMERSIO</span>. Crafted with Passion by <span className="text-blue-400">Cutie Patootie</span>.
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
        .animate-bounce-slow {
          animation: bounce-slow 4s ease-in-out infinite;
        }
        .animate-voice-wave {
          animation: voice-wave 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Intro;
