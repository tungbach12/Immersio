import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Switch } from "@/components/ui/Switch";
import { Save } from "lucide-react";

export default function AITuning() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">AI Tuning Center</h1>
          <p className="text-slate-500 mt-1">Configure the behavior and personality of the AI tutors.</p>
        </div>
        <Button className="gap-2">
          <Save size={18} />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Global System Prompt</CardTitle>
          <CardDescription>This instruction is prepended to all scenario contexts.</CardDescription>
        </CardHeader>
        <CardContent>
          <textarea 
            className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm bg-slate-50"
            defaultValue={`You are an expert language tutor in the IMMERSIO app.
Your goal is to help users practice conversation in a natural, immersive way.
- Adapt your vocabulary to the user's CEFR level (currently B2).
- Be encouraging but correct critical mistakes.
- Maintain the persona defined in the specific scenario context.`}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Correction Strictness</CardTitle>
            <CardDescription>How aggressively should the AI correct grammar?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Grammar Sensitivity</span>
                <span className="text-sm text-slate-500">High</span>
              </div>
              <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Vocabulary Suggestions</span>
                <span className="text-sm text-slate-500">Medium</span>
              </div>
              <Slider defaultValue={[50]} max={100} step={1} className="w-full" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Voice & Personality</CardTitle>
            <CardDescription>Adjust the tone of voice generation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">Enable Slang/Idioms</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <span className="font-medium text-slate-700">Speed of Speech</span>
              <select className="bg-transparent font-medium text-slate-900 outline-none">
                <option>0.8x (Slow)</option>
                <option selected>1.0x (Normal)</option>
                <option>1.2x (Fast)</option>
              </select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
