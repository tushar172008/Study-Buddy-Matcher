import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Student, ChatSession, ChatMessage } from '../types';
import { MOCK_REPLIES } from '../data';
import { 
  Send, Zap, Calendar, Ban, Check, Shield, Paperclip, 
  FileText, Image, File, BarChart2, Plus, X, Clock, 
  Sparkles, Download, CheckCircle, ChevronDown, MessageSquare
} from 'lucide-react';

interface ChatPanelProps {
  matchedBuddies: Student[];
  chatSessions: Record<string, ChatSession>;
  onSendMessage: (buddyId: string, text: string, file?: any, poll?: any) => void;
  onReceiveMessage: (buddyId: string, text: string, file?: any, poll?: any) => void;
  onBlockBuddy: (buddyId: string) => void;
  onOpenSchedule: (buddy: Student, isQuick: boolean) => void;
  onVotePoll: (buddyId: string, messageId: string, slot: string) => void;
}

const POLL_DEFAULT_SLOTS = [
  'Mon Morning (8-12)',
  'Tue Evening (4-8)',
  'Wed Afternoon (12-4)',
  'Thu Morning (8-12)',
  'Fri Afternoon (12-4)',
  'Sat Morning (9-12)'
];

export default function ChatPanel({
  matchedBuddies,
  chatSessions,
  onSendMessage,
  onReceiveMessage,
  onBlockBuddy,
  onOpenSchedule,
  onVotePoll,
}: ChatPanelProps) {
  const [selectedBuddyId, setSelectedBuddyId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Custom interactive poll creator state
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('When should we study next?');
  const [pollSelectedSlots, setPollSelectedSlots] = useState<string[]>([
    'Mon Morning (8-12)',
    'Tue Evening (4-8)',
    'Wed Afternoon (12-4)'
  ]);

  // File uploading simulation state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedBuddy = matchedBuddies.find(b => b.id === selectedBuddyId);
  const activeSession = selectedBuddyId ? chatSessions[selectedBuddyId] : null;

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.messages, isTyping, showPollCreator]);

  // Set default buddy when first loaded
  useEffect(() => {
    if (matchedBuddies.length > 0 && !selectedBuddyId) {
      setSelectedBuddyId(matchedBuddies[0].id);
    }
  }, [matchedBuddies, selectedBuddyId]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedBuddyId) return;

    const userMsgText = inputText.trim();
    onSendMessage(selectedBuddyId, userMsgText);
    setInputText('');

    // Trigger mock reply simulation
    triggerMockReply(userMsgText);
  };

  const triggerMockReply = (triggerText: string, delay = 1800) => {
    if (!selectedBuddyId) return;
    setIsTyping(true);
    
    setTimeout(() => {
      setIsTyping(false);
      const replies = MOCK_REPLIES[selectedBuddyId] || ["That sounds like a plan!", "Let's definitely study."];
      const messageIndex = activeSession ? activeSession.messages.length : 0;
      let replyText = replies[Math.floor(messageIndex / 2) % replies.length];

      if (triggerText.toLowerCase().includes('poll')) {
        replyText = "Awesome, thanks for setting up that poll! I just selected my preferred times. Look at the poll status!";
      }

      onReceiveMessage(selectedBuddyId, replyText);
    }, delay);
  };

  // Simulate file upload (PDF, JPEG, DOC)
  const handleFileUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBuddyId) return;

    // Categorize type
    let fileType = 'other';
    if (file.type.includes('pdf')) fileType = 'pdf';
    else if (file.type.includes('image') || file.name.endsWith('.jpg') || file.name.endsWith('.jpeg') || file.name.endsWith('.png')) fileType = 'image';
    else if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.txt')) fileType = 'doc';

    const fileSizeStr = file.size > 1024 * 1024 
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
      : `${(file.size / 1024).toFixed(0)} KB`;

    // Dispatch message with file attachment
    onSendMessage(
      selectedBuddyId, 
      `Sent an academic file attachment: ${file.name}`, 
      { name: file.name, size: fileSizeStr, type: fileType }
    );

    // Dynamic typing reply triggered by file share
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      onReceiveMessage(selectedBuddyId, `Oh nice! Thank you for sharing the ${file.name} review doc. Let's look over this during our session.`);
    }, 1500);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create availability poll
  const togglePollSlot = (slot: string) => {
    setPollSelectedSlots(prev =>
      prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
    );
  };

  const handleSendPoll = () => {
    if (!selectedBuddyId) return;
    if (pollSelectedSlots.length === 0) return;

    const options = pollSelectedSlots.map(slot => ({
      slot,
      votes: [] as string[]
    }));

    onSendMessage(
      selectedBuddyId,
      `📊 Sent an active Time Availability Poll: "${pollQuestion}"`,
      undefined,
      {
        question: pollQuestion,
        options
      }
    );

    setShowPollCreator(false);

    // Buddy auto-votes after 2 seconds to make poll feel functional and interactive
    setTimeout(() => {
      // Find the last poll message sent
      const session = chatSessions[selectedBuddyId];
      if (session) {
        const lastMsg = [...session.messages].reverse().find(m => m.poll);
        if (lastMsg && lastMsg.poll) {
          // Vote on a random slot from the options
          const randomSlotIndex = Math.floor(Math.random() * lastMsg.poll.options.length);
          const votedSlot = lastMsg.poll.options[randomSlotIndex].slot;
          
          // Trigger persistent vote for the buddy
          // Directly manipulate local session structure or update
          onVotePoll(selectedBuddyId, lastMsg.id, votedSlot);
          
          // Dispatch verification message
          onReceiveMessage(selectedBuddyId, `Voted on: "${votedSlot}" in your study poll! Let's schedule that.`);
        }
      }
    }, 2000);
  };

  if (matchedBuddies.length === 0) {
    return (
      <div className="bg-white border border-slate-100 rounded-3xl p-8 text-center h-[500px] flex flex-col items-center justify-center" id="empty-chat-panel">
        <div className="w-12 h-12 bg-slate-50 text-slate-900 border border-slate-100 rounded-full flex items-center justify-center mb-4" id="empty-chat-icon">
          <Shield className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-950" id="empty-chat-title">No Active Study Connections</h4>
        <p className="text-xs text-slate-500 max-w-xs mt-2 leading-relaxed text-center" id="empty-chat-desc">
          Study connections unlock once you match with a peer under the <strong>Find Buddy</strong> tab. Keep exploring to connect with peers in your courses!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-3xl h-[600px] grid grid-cols-1 md:grid-cols-3 overflow-hidden shadow-sm" id="chat-panel-container">
      {/* Left Column: Buddy List */}
      <div className="border-r border-slate-100 flex flex-col bg-slate-50/40 md:col-span-1" id="chat-buddies-list">
        <div className="p-4 border-b border-slate-100 bg-white" id="buddies-list-header">
          <h4 className="text-[10px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Your Study Buddies
          </h4>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100" id="buddies-items-wrapper">
          {matchedBuddies.map((buddy) => {
            const isSelected = buddy.id === selectedBuddyId;
            const lastMsg = chatSessions[buddy.id]?.messages?.slice(-1)[0];
            return (
              <button
                type="button"
                key={buddy.id}
                id={`chat-buddy-item-${buddy.id}`}
                onClick={() => setSelectedBuddyId(buddy.id)}
                className={`w-full text-left p-4 flex items-center gap-3 transition-all ${
                  isSelected ? 'bg-white border-l-4 border-slate-950 font-bold' : 'hover:bg-slate-100/30'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs shrink-0 relative">
                  {buddy.avatarSeed}
                  {buddy.isCurrentlyFree && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="flex-1 min-w-0" id={`buddy-info-${buddy.id}`}>
                  <div className="flex justify-between items-baseline">
                    <h5 className="text-xs font-bold text-slate-950 truncate">{buddy.name}</h5>
                    {buddy.isCurrentlyFree && (
                      <span className="text-[8px] font-bold text-slate-950 bg-slate-50 border border-slate-100 px-1 rounded">FREE</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5" id={`buddy-sub-${buddy.id}`}>
                    {buddy.major}
                  </p>
                  {lastMsg && (
                    <p className="text-[10px] text-slate-600 truncate mt-1 italic font-normal" id={`buddy-msg-${buddy.id}`}>
                      {lastMsg.senderId === 'me' ? 'You: ' : ''}{lastMsg.text}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right 2 Columns: Chat Area */}
      <div className="md:col-span-2 flex flex-col bg-white h-full relative" id="chat-conversation-area">
        {selectedBuddy && activeSession ? (
          <>
            {/* Conversation Header (Premium Glassmorphic Blur Effect) */}
            <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-white/75 backdrop-blur-md sticky top-0 z-20" id="chat-convo-header">
              <div className="flex items-center gap-3 min-w-0" id="chat-header-profile">
                <div className="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {selectedBuddy.avatarSeed}
                </div>
                <div className="min-w-0" id="chat-header-names">
                  <h5 className="text-xs font-bold text-slate-950 flex items-center gap-1.5 truncate">
                    {selectedBuddy.name}
                    {selectedBuddy.isCurrentlyFree && (
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    )}
                  </h5>
                  <p className="text-[10px] text-slate-400 truncate">{selectedBuddy.major}</p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2" id="chat-header-actions">
                <button
                  type="button"
                  id={`quick-session-btn-${selectedBuddy.id}`}
                  onClick={() => onOpenSchedule(selectedBuddy, true)}
                  className={`relative px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all active:scale-95 ${
                    selectedBuddy.isCurrentlyFree
                      ? 'bg-slate-950 hover:bg-black text-white'
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                  disabled={!selectedBuddy.isCurrentlyFree}
                  title={selectedBuddy.isCurrentlyFree ? "Propose immediate 30-min co-working study" : "Peer not currently marked available"}
                >
                  <Zap className={`w-3 h-3 ${selectedBuddy.isCurrentlyFree ? 'fill-white' : ''}`} />
                  Quick Session
                </button>

                <button
                  type="button"
                  id={`propose-schedule-btn-${selectedBuddy.id}`}
                  onClick={() => onOpenSchedule(selectedBuddy, false)}
                  className="px-2.5 py-1.5 border border-slate-100 hover:bg-slate-50 text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95"
                  title="Schedule a future session"
                >
                  <Calendar className="w-3 h-3" />
                  Schedule
                </button>

                <button
                  type="button"
                  id={`chat-block-btn-${selectedBuddy.id}`}
                  onClick={() => onBlockBuddy(selectedBuddy.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-950 rounded-xl hover:bg-slate-50 transition-colors"
                  title="Block and remove conversation"
                >
                  <Ban className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/10" id="chat-messages-container">
              <div className="text-center my-1" id="chat-encrypted-indicator">
                <span className="text-[8px] font-bold tracking-wider text-slate-900 bg-white border border-slate-100 px-2.5 py-1 rounded-full">
                  ✓ Peer Match Verified
                </span>
              </div>

              {activeSession.messages.map((msg) => {
                const isMe = msg.senderId === 'me';
                
                // Check if message is a file sharing bubble
                const hasFile = !!msg.file;
                
                // Check if message is an availability poll bubble
                const hasPoll = !!msg.poll;

                return (
                  <div
                    key={msg.id}
                    id={`chat-msg-row-${msg.id}`}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {hasPoll ? (
                      /* Interactive Poll UI Bubble (PRD 5.3) with glass effects */
                      <motion.div 
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-sm bg-white/80 border border-slate-100 backdrop-blur-md rounded-2xl p-4 shadow-sm space-y-3"
                        id={`poll-bubble-${msg.id}`}
                      >
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-1.5">
                            <BarChart2 className="w-4 h-4 text-slate-950 animate-pulse" />
                            <h6 className="text-[10px] font-bold uppercase tracking-wider text-slate-950">
                              Time Availability Poll
                            </h6>
                          </div>
                          <span className="text-[8px] font-bold text-slate-400 uppercase">
                            {isMe ? 'Sent by me' : `Sent by ${selectedBuddy.name}`}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-950">{msg.poll?.question}</p>
                        
                        <div className="space-y-2">
                          {msg.poll?.options.map((option) => {
                            const totalVotes = msg.poll?.options.reduce((acc, curr) => acc + curr.votes.length, 0) || 0;
                            const voteCount = option.votes.length;
                            const votePercentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                            const myVote = option.votes.includes('me');
                            const buddyVote = option.votes.includes(selectedBuddy.id);

                            return (
                              <button
                                key={option.slot}
                                type="button"
                                onClick={() => onVotePoll(selectedBuddy.id, msg.id, option.slot)}
                                className={`w-full text-left p-2.5 rounded-xl border relative overflow-hidden transition-all flex flex-col justify-between ${
                                  myVote 
                                    ? 'border-slate-950 bg-slate-50/30' 
                                    : 'border-slate-150 bg-white hover:border-slate-300'
                                }`}
                              >
                                {/* Animated Poll Progress Bar with Glass Styling */}
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-slate-950/[0.04] transition-all duration-500 ease-out z-0" 
                                  style={{ width: `${votePercentage}%` }}
                                />

                                <div className="flex items-center justify-between w-full relative z-10 text-xs">
                                  <span className={`font-bold ${myVote ? 'text-slate-950' : 'text-slate-800'}`}>
                                    {option.slot}
                                  </span>
                                  <div className="flex items-center gap-1.5 font-bold">
                                    {myVote && <span className="text-[9px] text-slate-950 bg-slate-100 px-1.5 py-0.5 rounded-full">My Vote</span>}
                                    <span className="text-slate-500">{voteCount} {voteCount === 1 ? 'vote' : 'votes'}</span>
                                  </div>
                                </div>

                                {/* Voter badges */}
                                {(myVote || buddyVote) && (
                                  <div className="flex gap-1.5 mt-1.5 relative z-10">
                                    {myVote && (
                                      <span className="text-[8px] bg-slate-950 text-white px-1.5 py-0.5 rounded-md font-bold">You</span>
                                    )}
                                    {buddyVote && (
                                      <span className="text-[8px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                                        {selectedBuddy.name.split(' ')[0]}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                        
                        <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Click options above to vote/unvote</span>
                          <button
                            type="button"
                            onClick={() => onOpenSchedule(selectedBuddy, false)}
                            className="text-slate-950 font-bold uppercase tracking-wider underline flex items-center gap-1 hover:text-black"
                          >
                            Book Meeting Room
                          </button>
                        </div>
                      </motion.div>
                    ) : hasFile ? (
                      /* File Sharing UI Bubble */
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-slate-950 text-white rounded-tr-none'
                              : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                          }`}
                        >
                          {/* Rich File Header Card */}
                          <div className={`flex items-center gap-3 p-2.5 rounded-xl mb-2 border ${
                            isMe 
                              ? 'bg-white/10 border-white/20 text-white' 
                              : 'bg-slate-50 border-slate-100 text-slate-900'
                          }`}>
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              isMe ? 'bg-white/20' : 'bg-slate-200 text-slate-900'
                            }`}>
                              {msg.file?.type === 'pdf' && <FileText className="w-5 h-5" />}
                              {msg.file?.type === 'image' && <Image className="w-5 h-5" />}
                              {msg.file?.type === 'doc' && <File className="w-5 h-5" />}
                              {msg.file?.type === 'other' && <File className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <h6 className="font-bold truncate text-[11px]">{msg.file?.name}</h6>
                              <span className={`text-[9px] block ${isMe ? 'text-slate-300' : 'text-slate-400'}`}>
                                {msg.file?.size} • {msg.file?.type.toUpperCase()} File
                              </span>
                            </div>
                            <button
                              type="button"
                              className={`p-1 rounded hover:opacity-80 shrink-0 ${isMe ? 'text-white' : 'text-slate-500'}`}
                              onClick={() => alert(`Simulating file download: ${msg.file?.name}`)}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          <p>{msg.text}</p>
                          
                          <span className={`text-[8px] block text-right mt-1.5 ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                            {msg.timestamp}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Standard Text Message Bubble with subtle spring reveals */
                      <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        isMe
                          ? 'bg-slate-950 text-white rounded-tr-none'
                          : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                      }`}>
                        <p>{msg.text}</p>
                        <span className={`text-[8px] block text-right mt-1.5 ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex justify-start" id="typing-indicator-row">
                  <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center gap-1" id="typing-bubble">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    <span className="text-[9px] text-slate-400 ml-1.5 italic">{selectedBuddy.name} is typing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Availability Poll Builder Dropdown (Glassmorphic Slideup Panel) */}
            <AnimatePresence>
              {showPollCreator && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-slate-50 border-t border-slate-100 p-4 space-y-3 relative z-10"
                  id="poll-creator-panel"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4 text-slate-950" />
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-950">Assemble Study Time Poll</h5>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setShowPollCreator(false)}
                      className="p-1 hover:bg-slate-200 rounded-full"
                    >
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-900">Poll Question</label>
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="e.g. When are we meeting for MATH 290 review?"
                      className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-slate-950"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-900">
                      Include Time Slots ({pollSelectedSlots.length} Selected)
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1 bg-white border border-slate-100 rounded-xl" id="poll-slots-picker">
                      {POLL_DEFAULT_SLOTS.map((slot) => {
                        const isIncluded = pollSelectedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => togglePollSlot(slot)}
                            className={`p-2 rounded-lg border text-left text-[10px] font-bold flex items-center justify-between transition-all ${
                              isIncluded
                                ? 'bg-slate-950 text-white border-slate-950'
                                : 'bg-slate-50 text-slate-600 border-slate-150 hover:border-slate-200'
                            }`}
                          >
                            <span className="truncate pr-1">{slot}</span>
                            <span className="text-[8px] opacity-70 shrink-0">
                              {isIncluded ? '✓ Selected' : '+ Add'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendPoll}
                    disabled={pollSelectedSlots.length === 0}
                    className="w-full bg-slate-950 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider py-2 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Launch Time Poll to Match
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Input Box (Stunning Glassmorphic Input Section) */}
            <div className="p-3 border-t border-slate-100 bg-white" id="chat-input-controls">
              {/* Secret input for file uploads */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />

              <form onSubmit={handleSend} className="flex items-center gap-2" id="chat-input-form">
                {/* Trigger Availability Poll Button */}
                <button
                  type="button"
                  id="chat-toggle-poll-btn"
                  onClick={() => setShowPollCreator(!showPollCreator)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                    showPollCreator 
                      ? 'bg-slate-950 text-white border-slate-950 shadow-sm' 
                      : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300'
                  }`}
                  title="Launch co-study time availability poll"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>

                {/* Attach File Button */}
                <button
                  type="button"
                  id="chat-attach-file-btn"
                  onClick={handleFileUploadClick}
                  className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-50 text-slate-600 border border-slate-100 hover:border-slate-300 shrink-0 transition-all"
                  title="Share PDFs, images, docs"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  id="chat-message-input"
                  placeholder={`Message ${selectedBuddy.name.split(' ')[0]}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 text-xs px-3.5 py-2 border border-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-950 bg-white"
                />
                
                <button
                  type="submit"
                  id="send-msg-btn"
                  disabled={!inputText.trim()}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    inputText.trim()
                      ? 'bg-slate-950 text-white hover:bg-black'
                      : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6" id="chat-loading-select">
            <p className="text-xs text-slate-400">Select a study buddy on the left to start co-ordinating sessions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
