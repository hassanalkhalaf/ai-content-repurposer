import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const MAX_MESSAGE_LENGTH = 5000;

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح." }, { status: 400 });
  }

  const { name, email, message } = body;

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "الرجاء تعبئة جميع الحقول." }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: "البريد الإلكتروني غير صالح." }, { status: 400 });
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({ error: "الرسالة طويلة جداً." }, { status: 400 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY مفقود من متغيرات البيئة.");
    return NextResponse.json(
      { error: "الخدمة غير متوفرة حالياً. حاول لاحقاً." },
      { status: 500 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>",
      to: process.env.CONTACT_RECEIVER_EMAIL ?? "your-inbox@example.com",
      replyTo: email,
      subject: `رسالة جديدة من ${name}`,
      text: `الاسم: ${name}\nالإيميل: ${email}\n\nالرسالة:\n${message}`,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "تعذر إرسال الرسالة. حاول مرة ثانية." },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Unexpected contact form error:", err);
    return NextResponse.json(
      { error: "حدث خطأ غير متوقع. حاول لاحقاً." },
      { status: 500 }
    );
  }
}
