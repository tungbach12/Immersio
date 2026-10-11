import { useState } from "react";
import { Mail } from "lucide-react";
import { PageHeading } from "@/components/learning/PageHeading";
import { FaqItem } from "@/features/help/components/FaqItem";

const questions = [
  {
    question: "How can I get clearer pronunciation feedback?",
    answer:
      "Choose a quiet place, listen to the practice phrase first, and speak at a comfortable pace. Stop your recording when you finish, then open a word in the feedback to see its individual sounds.",
  },
  {
    question: "When will my saved words appear for review?",
    answer:
      "Your review schedule follows the answers you give when studying a card. Mark a card as “Still learning” for more practice, or “Got it” when it feels familiar. The word collection shows how many cards are ready now.",
  },
  {
    question: "Can I practise more than one language?",
    answer:
      "Yes. Choose a language in the conversation library, dictionary, or speaking practice. Your next practice uses that selection.",
  },
  {
    question: "How do I keep words from a conversation?",
    answer:
      "Finish your practice to open the conversation review. Select the cards you want to keep, then save them to an existing collection or create a new one.",
  },
];

export default function HelpCenter() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="help-workspace">
      <PageHeading
        eyebrow="A little help along the way"
        title="You don’t have to figure it out alone."
        description="A few answers to help you settle into your learning space."
      />
      <div className="help-questions">
        {questions.map((item, index) => (
          <FaqItem
            key={item.question}
            {...item}
            open={open === index}
            onToggle={() =>
              setOpen((previous) => (previous === index ? null : index))
            }
          />
        ))}
      </div>
      <section className="learning-paper help-contact">
        <Mail size={25} />
        <div>
          <h2>Still a little stuck?</h2>
          <p>Write to our support team and tell us what happened.</p>
        </div>
        <a href="mailto:support@immersio.me" className="workspace-primary-link">
          Email support
        </a>
      </section>
    </div>
  );
}
