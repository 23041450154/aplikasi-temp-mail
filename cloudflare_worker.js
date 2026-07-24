// Langkah 2: Kode Cloudflare Worker (JavaScript/ES Modules)
// Cloudflare Worker untuk menangkap Catch-all email dan mem-forward ke Supabase
// Pastikan untuk mengatur env variables: SUPABASE_URL dan SUPABASE_ANON_KEY

export default {
  async email(message, env, ctx) {
    try {
      // 1. Membaca headers (Pengirim, Penerima, dan Subjek)
      const toAddress = message.to;
      const fromAddress = message.headers.get("from") || "Unknown";
      const subject = message.headers.get("subject") || "No Subject";
      
      // 2. Mengonversi stream data message.raw menjadi teks menggunakan TextDecoder
      const rawEmailStream = message.raw;
      const reader = rawEmailStream.getReader();
      const decoder = new TextDecoder("utf-8");
      
      let rawEmailText = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        rawEmailText += decoder.decode(value, { stream: true });
      }
      
      // Untuk kesederhanaan, kita simpan isi raw email ke database.
      // Pada sistem produksi, sebaiknya gunakan library seperti 'postal-mime' 
      // untuk mengekstrak body text atau HTML dari MIME stream yang kompleks.
      const body = rawEmailText;

      // 3. Menyiapkan payload data untuk Supabase
      const payload = {
        to_address: toAddress,
        from_address: fromAddress,
        subject: subject,
        body: body
      };

      // 4. Proses POST request menggunakan ctx.waitUntil()
      // ctx.waitUntil mencegah proses request ke database memblokir siklus respon email.
      const insertToSupabase = async () => {
        const response = await fetch(`${env.SUPABASE_URL}/rest/v1/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": env.SUPABASE_ANON_KEY,
            "Authorization": `Bearer ${env.SUPABASE_ANON_KEY}`,
            "Prefer": "return=minimal" // Opsional: menghemat bandwidth
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.error("Gagal menyimpan email ke Supabase:", await response.text());
        }
      };

      ctx.waitUntil(insertToSupabase());
      
    } catch (error) {
      console.error("Terjadi error saat memproses email masuk:", error);
    }
  }
};
