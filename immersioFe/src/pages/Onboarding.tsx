import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { User, Briefcase, GraduationCap, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const roles = [
  {
    id: "student",
    title: "Student",
    description: "I want to improve my grades and study abroad.",
    icon: GraduationCap,
    color: "bg-blue-500",
  },
  {
    id: "professional",
    title: "Professional",
    description: "I need language skills for my career and business.",
    icon: Briefcase,
    color: "bg-indigo-600",
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "I love travel and connecting with new cultures.",
    icon: User,
    color: "bg-emerald-500",
  },
];

const languages = [
  {
    id: "english",
    title: "English",
    native: "English",
    flag: "🇺🇸",
    color: "bg-blue-600",
  },
  {
    id: "chinese",
    title: "Chinese",
    native: "中文",
    flag: "🇨🇳",
    color: "bg-red-600",
  },
  {
    id: "japanese",
    title: "Japanese",
    native: "日本語",
    flag: "🇯🇵",
    color: "bg-rose-500",
  },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const handleContinue = () => {
    if (step === 1 && selectedRole) {
      setStep(2);
    } else if (step === 2 && selectedLanguage) {
      navigate("/student/dashboard");
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="flex justify-center mb-8">
          <img src="/logo.png" alt="IMMERSIO Logo" className="h-16 w-auto object-contain rounded-2xl" />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-4 italic">
            {step === 1 ? "Tell us about yourself" : "What do you want to learn?"}
          </h1>
          <p className="text-lg text-slate-500">
            {step === 1 
              ? "We'll personalize your learning experience based on your goals."
              : "Choose the language you want to master with IMMERSIO."}
          </p>
        </div>

        {step === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {roles.map((role) => (
              <motion.div
                key={role.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedRole(role.id)}
                className="cursor-pointer"
              >
                <Card
                  className={cn(
                    "h-full border-2 transition-all duration-300 rounded-[2rem]",
                    selectedRole === role.id
                      ? "border-indigo-600 ring-4 ring-indigo-100 shadow-xl"
                      : "border-transparent hover:border-slate-200"
                  )}
                >
                  <CardContent className="p-8 flex flex-col items-center text-center h-full">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg",
                        role.color
                      )}
                    >
                      <role.icon size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      {role.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {role.description}
                    </p>
                    {selectedRole === role.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-6 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white"
                      >
                        <Check size={16} />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {languages.map((lang) => (
              <motion.div
                key={lang.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedLanguage(lang.id)}
                className="cursor-pointer"
              >
                <Card
                  className={cn(
                    "h-full border-2 transition-all duration-300 rounded-[2rem]",
                    selectedLanguage === lang.id
                      ? "border-indigo-600 ring-4 ring-indigo-100 shadow-xl"
                      : "border-transparent hover:border-slate-200"
                  )}
                >
                  <CardContent className="p-8 flex flex-col items-center text-center h-full">
                    <div
                      className={cn(
                        "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-lg",
                        lang.color
                      )}
                    >
                      {lang.flag}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">
                      {lang.title}
                    </h3>
                    <p className="text-slate-500 font-medium mb-2">
                      {lang.native}
                    </p>
                    {selectedLanguage === lang.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-4 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white"
                      >
                        <Check size={16} />
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          {step === 2 && (
            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto min-w-[150px] h-14 text-lg rounded-2xl font-bold text-slate-500"
              onClick={handleBack}
            >
              Back
            </Button>
          )}
          <Button
            size="lg"
            className="w-full sm:w-auto min-w-[200px] h-14 text-lg rounded-2xl font-bold shadow-xl shadow-indigo-200"
            disabled={step === 1 ? !selectedRole : !selectedLanguage}
            onClick={handleContinue}
          >
            {step === 1 ? "Next Step" : "Get Started"}
            <ArrowRight className="ml-2" />
          </Button>
        </div>
        
        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mt-8">
          <div className={cn("w-2 h-2 rounded-full transition-all", step === 1 ? "w-8 bg-indigo-600" : "bg-slate-300")} />
          <div className={cn("w-2 h-2 rounded-full transition-all", step === 2 ? "w-8 bg-indigo-600" : "bg-slate-300")} />
        </div>
      </div>
    </div>
  );
}
