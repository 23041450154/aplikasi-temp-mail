"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import PostalMime from "postal-mime";

type Email = {
  id: string;
  to_address: string;
  from_address: string;
  subject: string;
  body: string;
  created_at: string;
};

const FIRST_NAMES = ["budi", "andi", "siti", "joko", "ayu", "ratna", "agus", "dwi", "putri", "hendra", "mega", "kiki", "rini", "lukman", "dian", "alex", "john", "jane", "sarah", "michael", "david", "emma", "chris", "ryan", "jessica", "kevin", "nina"];
const LAST_NAMES = ["saputra", "wijaya", "pratama", "sari", "setiawan", "lestari", "kusuma", "hidayat", "susanti", "smith", "doe", "johnson", "brown", "davis", "miller", "wilson", "moore", "taylor", "anderson", "thomas", "jackson", "white", "harris"];

export default function Home() {
  const [currentEmail, setCurrentEmail] = useState<string>("");
  const [emailHistory, setEmailHistory] = useState<string[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [customUsername, setCustomUsername] = useState("");
  const [customDomain, setCustomDomain] = useState("@falstore.web.id");
  const [notification, setNotification] = useState<string | null>(null);
  const [parsedHtml, setParsedHtml] = useState<string>("");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const addToHistory = (newEmail: string) => {
    setEmailHistory((prev) => {
      // Hapus jika sudah ada (agar tidak ganda), lalu taruh di atas
      const updated = [newEmail, ...prev.filter(e => e !== newEmail)].slice(0, 20); // Batasi 20 email terakhir
      localStorage.setItem("emailHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const generateNewEmail = () => {
    const randomFirstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const randomLastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    
    // Tentukan jumlah digit angka secara acak (0 sampai 4 digit)
    const numDigits = Math.floor(Math.random() * 5); // 0, 1, 2, 3, 4
    let randomNumberStr = "";
    if (numDigits > 0) {
      const maxVal = Math.pow(10, numDigits) - 1;
      const minVal = numDigits === 1 ? 0 : Math.pow(10, numDigits - 1);
      randomNumberStr = (Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal).toString();
    }
    
    // Variasi penulisan nama (0 = pakai titik, 1 = digabung, 2 = nama depan saja, 3 = nama belakang saja)
    const patternType = Math.floor(Math.random() * 4);
    
    let prefix = "";
    if (patternType === 0) {
      prefix = `${randomFirstName}.${randomLastName}`;
    } else if (patternType === 1) {
      prefix = `${randomFirstName}${randomLastName}`;
    } else if (patternType === 2) {
      prefix = `${randomFirstName}`;
    } else {
      prefix = `${randomLastName}`;
    }
    
    prefix = `${prefix}${randomNumberStr}`;
    
    const domains = ["@falstore.web.id", "@naufal.me", "@formakip.web.id"];
    const randomDomain = domains[Math.floor(Math.random() * domains.length)];
    const newEmail = `${prefix}${randomDomain}`;
    
    setCurrentEmail(newEmail);
    addToHistory(newEmail);
    setEmails([]);
    setSelectedEmail(null);
    return newEmail;
  };

  // Muat history saat pertama kali halaman dibuka
  useEffect(() => {
    const saved = localStorage.getItem("emailHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setEmailHistory(parsed);
          setCurrentEmail(parsed[0]); // Gunakan email terakhir yang aktif
          return;
        }
      } catch (e) {}
    }
    generateNewEmail();
  }, []);

  const selectEmailFromHistory = (email: string) => {
    setCurrentEmail(email);
    addToHistory(email); // Jadikan posisi teratas
    setIsDropdownOpen(false);
    setEmails([]);
    setSelectedEmail(null);
  };

  const copyToClipboard = () => {
    if (currentEmail) {
      navigator.clipboard.writeText(currentEmail);
      setNotification("Alamat email berhasil disalin!");
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleDeleteEmail = () => {
    if (!currentEmail) return;
    
    // Hapus dari riwayat
    setEmailHistory((prev) => {
      const updated = prev.filter(e => e !== currentEmail);
      localStorage.setItem("emailHistory", JSON.stringify(updated));
      return updated;
    });
    
    // Bikin email baru otomatis (dan kosongkan kotak masuk)
    generateNewEmail();
    
    setNotification("Email berhasil dihapus dari riwayat!");
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchEmails = async (email: string) => {
    setIsLoading(true);
    
    // Memastikan animasi muter berjalan minimal 1.2 detik
    const minLoadingTime = new Promise((resolve) => setTimeout(resolve, 1200));
    
    const fetchPromise = supabase
      .from("emails")
      .select("*")
      .eq("to_address", email)
      .order("created_at", { ascending: false });

    const [_, { data, error }] = await Promise.all([minLoadingTime, fetchPromise]);

    if (error) {
      console.error("Error fetching emails:", error);
    } else {
      setEmails(data || []);
    }
    setIsLoading(false);
  };

  const handleCreateCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUsername) return;
    
    const newEmail = `${customUsername}${customDomain}`;
    setCurrentEmail(newEmail);
    addToHistory(newEmail);
    setEmails([]);
    setSelectedEmail(null);
    setIsCreateMode(false);
    setCustomUsername(""); // Reset form
  };

  // Fetch dan Subscribe Supabase
  useEffect(() => {
    if (!currentEmail) return;

    fetchEmails(currentEmail);

    const channel = supabase
      .channel(`realtime-emails-${currentEmail}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "emails",
          filter: `to_address=eq.${currentEmail}`,
        },
        (payload) => {
          const newEmail = payload.new as Email;
          setEmails((prevEmails) => {
            // Cegah duplikat jika auto-refresh dan realtime terpicu bersamaan
            if (prevEmails.some(e => e.id === newEmail.id)) return prevEmails;
            return [newEmail, ...prevEmails];
          });
        }
      )
      .subscribe();

    // Auto-refresh (fallback) setiap 10 detik
    const intervalId = setInterval(() => {
      fetchEmails(currentEmail);
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [currentEmail]);

  // Parse Raw MIME Body ketika email dipilih
  useEffect(() => {
    if (selectedEmail) {
      const parseEmail = async () => {
        try {
          const parser = new PostalMime();
          const email = await parser.parse(selectedEmail.body);
          setParsedHtml(email.html || email.text || "Pesan kosong atau tidak terbaca.");
        } catch (e) {
          console.error("Gagal mem-parse email, menampilkan raw:", e);
          setParsedHtml(selectedEmail.body); // Fallback ke teks mentah
        }
      };
      parseEmail();
    }
  }, [selectedEmail]);

  return (
    <div className="min-h-screen bg-[#0055b8] font-sans flex flex-col relative">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-6 right-6 bg-[#2eb92e] text-white px-6 py-4 rounded-md shadow-xl z-50 flex items-center gap-3 animate-[bounce_0.5s_ease-out]">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Hapus Email?</h3>
              <p className="text-sm text-gray-500 mb-6">Anda yakin ingin menghapus <strong>{currentEmail}</strong>? Tindakan ini akan menghilangkan alamat tersebut dari riwayat Anda.</p>
              
              <div className="flex justify-center gap-3">
                <button 
                  onClick={() => setIsDeleteConfirmOpen(false)} 
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => {
                    handleDeleteEmail();
                    setIsDeleteConfirmOpen(false);
                  }} 
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header / Nav */}
      <header className="text-white pt-6 pb-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Brand */}
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Falstore Logo" className="w-20 h-20 object-contain drop-shadow-md" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight leading-none uppercase">FALSTORE MAIL</h1>
              <p className="text-[10px] tracking-widest opacity-80 mt-1">HTTPS://MAIL.NAUFAL.ME</p>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-bold">
            <a href="#" className="hover:text-blue-200 transition-colors">Pengantar</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Pulihkan email yang dihapus</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Ketentuan Layanan</a>
            <a href="#" className="hover:text-blue-200 transition-colors">FAQ</a>
            <a href="#" className="hover:text-blue-200 transition-colors">API</a>
            <div className="bg-white text-gray-800 px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer font-medium">
              <span>id</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </nav>
        </div>
      </header>

      {/* Action Area (Email & Buttons OR Create Form) */}
      <div className="max-w-5xl mx-auto w-full px-4 mb-8 z-10">
        {isCreateMode ? (
          // CREATE MODE UI
          <div className="flex flex-col items-center">
            <div className="flex w-full items-stretch gap-3 mb-5">
              {/* Back button */}
              <button 
                onClick={() => setIsCreateMode(false)}
                className="bg-[#387bd3] hover:bg-[#4388e4] text-white px-5 rounded shadow-sm flex items-center justify-center transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>
              </button>

              {/* Input Group */}
              <form onSubmit={handleCreateCustomEmail} className="flex flex-1 flex-col md:flex-row bg-[#387bd3] rounded overflow-hidden shadow-sm">
                <input 
                  type="text" 
                  required
                  value={customUsername}
                  onChange={(e) => setCustomUsername(e.target.value.replace(/[^a-zA-Z0-9.-]/g, ''))}
                  placeholder="Masukkan Nama Pengguna"
                  className="flex-1 bg-transparent text-white placeholder-blue-200 px-5 py-3 md:py-0 outline-none min-w-0 border-b md:border-b-0 border-blue-300/50 md:border-none"
                />
                
                <div className="hidden md:flex items-center">
                  <div className="w-px h-6 bg-blue-300/50 mx-2"></div>
                </div>

                <select 
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  className="bg-transparent text-white/90 px-4 py-3 outline-none cursor-pointer appearance-none min-w-[140px] border-b md:border-b-0 border-blue-300/50 md:border-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23FFFFFF%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7em top 50%', backgroundSize: '.65em auto', paddingRight: '2.5rem' }}
                >
                  <option value="@falstore.web.id" className="text-gray-800">@falstore.web.id</option>
                  <option value="@naufal.me" className="text-gray-800">@naufal.me</option>
                  <option value="@formakip.web.id" className="text-gray-800">@formakip.web.id</option>
                </select>

                <button type="submit" className="bg-[#24b918] hover:bg-[#1fa014] text-white font-medium px-8 py-3 md:py-0 transition-colors">
                  Buat
                </button>
              </form>
            </div>
            
            <div className="text-white mb-3">or</div>
            
            <button 
              onClick={() => {
                generateNewEmail();
                setIsCreateMode(false);
              }}
              className="bg-[#dfb43a] hover:bg-[#ca9e2e] text-white font-medium px-8 py-2.5 rounded shadow-sm transition-colors"
            >
              Bikin Email Acak
            </button>
          </div>
        ) : (
          // VIEW MODE UI
          <>
            <div className="relative" ref={dropdownRef}>
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="bg-[#1a64c4] border border-[#3b7ed4] rounded-md p-4 mb-4 flex justify-between items-center cursor-pointer hover:bg-[#206bc9] transition-colors shadow-sm"
                title="Pilih email yang sudah pernah dibuat"
              >
                <p className="text-xl text-white font-medium pl-2">
                  {currentEmail || "Generating..."}
                </p>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-white opacity-70 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>

              {/* Dropdown Menu Riwayat Email */}
              {isDropdownOpen && emailHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg overflow-hidden z-20 border border-gray-200">
                  <div className="max-h-64 overflow-y-auto">
                    {emailHistory.map((email, idx) => (
                      <div 
                        key={idx}
                        onClick={() => selectEmailFromHistory(email)}
                        className={`px-6 py-4 cursor-pointer text-gray-700 hover:bg-gray-50 border-b last:border-b-0 border-gray-100 flex items-center gap-3 ${email === currentEmail ? 'bg-blue-50 font-medium text-blue-700' : ''}`}
                      >
                        {email}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={copyToClipboard} className="flex items-center justify-center gap-2 bg-[#1a64c4] hover:bg-[#206bc9] text-white transition-colors py-3 rounded-md font-medium shadow-sm border border-[#3b7ed4]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy
              </button>
              <button disabled={isLoading} onClick={() => fetchEmails(currentEmail)} className={`flex items-center justify-center gap-2 bg-[#1a64c4] hover:bg-[#206bc9] text-white transition-colors py-3 rounded-md font-medium shadow-sm border border-[#3b7ed4] ${isLoading ? 'opacity-80 cursor-not-allowed' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
                Refresh
              </button>
              <button onClick={() => setIsCreateMode(true)} className="flex items-center justify-center gap-2 bg-[#1a64c4] hover:bg-[#206bc9] text-white transition-colors py-3 rounded-md font-medium shadow-sm border border-[#3b7ed4]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                New
              </button>
              <button onClick={() => setIsDeleteConfirmOpen(true)} className="flex items-center justify-center gap-2 bg-[#1a64c4] hover:bg-[#206bc9] text-white transition-colors py-3 rounded-md font-medium shadow-sm border border-[#3b7ed4]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Main Inbox (White band layout) */}
      <div className="w-full bg-white flex-1 relative flex justify-center pb-20 pt-10 px-4 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)]">
        {/* We place the inbox inside this white section */}
        <div className="max-w-5xl w-full">
          {selectedEmail ? (
            <div className="p-8 border border-gray-100 rounded-lg shadow-sm bg-white min-h-[300px]">
              <button 
                onClick={() => setSelectedEmail(null)}
                className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Back to Inbox
              </button>
              <div className="border-b pb-4 mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedEmail.subject}</h2>
                <p className="text-gray-600"><span className="font-semibold text-gray-700">From:</span> {selectedEmail.from_address}</p>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date(selectedEmail.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                </p>
                
                <div className="p-8 text-gray-800 text-sm overflow-x-auto min-h-[400px]">
                  {parsedHtml ? (
                    <iframe
                      srcDoc={parsedHtml}
                      title="Email Content"
                      className="w-full min-h-[600px] border-none bg-white rounded-md"
                      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    />
                  ) : (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 border-t-blue-600"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="border border-gray-100 rounded-lg shadow-sm bg-white min-h-[300px] flex flex-col">
              {emails.length > 0 && (
                 <div className="hidden md:grid bg-gray-50 px-6 py-3 border-b text-sm font-semibold text-gray-500 grid-cols-12 gap-4 rounded-t-lg">
                   <div className="col-span-3">SENDER</div>
                   <div className="col-span-6">SUBJECT</div>
                   <div className="col-span-3 text-right">TIME</div>
                 </div>
              )}
              
              {emails.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-gray-400">
                  <p className="text-2xl font-normal text-gray-400">Kotak Masuk Kosong</p>
                </div>
              ) : (
                <div className="divide-y overflow-y-auto max-h-[500px]">
                  {emails.map((email) => (
                    <div 
                      key={email.id} 
                      onClick={() => setSelectedEmail(email)}
                      className="px-6 py-4 flex flex-col md:grid md:grid-cols-12 gap-1 md:gap-4 hover:bg-blue-50 cursor-pointer transition-colors md:items-center"
                    >
                      <div className="md:col-span-3 font-medium text-gray-700 truncate" title={email.from_address}>
                        {email.from_address.split('<')[0]}
                      </div>
                      <div className="md:col-span-6 text-gray-600 truncate font-medium md:font-normal text-sm md:text-base">
                        {email.subject}
                      </div>
                      <div className="md:col-span-3 text-left md:text-right text-xs text-gray-500 mt-1 md:mt-0">
                        {new Date(email.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      <footer className="bg-[#0055b8] py-8 text-center text-white text-sm">
        <p>Copyright © {new Date().getFullYear()} - FALSTORE MAIL</p>
      </footer>
    </div>
  );
}
