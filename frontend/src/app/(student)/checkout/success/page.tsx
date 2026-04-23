"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, BookOpen } from "lucide-react";

export default function CheckoutSuccessPage() {
  useEffect(() => {
    // The enrollment is created by the Stripe webhook on the backend.
    // This page is just confirmation UI — no enrollment logic here.
  }, []);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="size-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="size-10 text-green-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Compra realizada!</h1>
          <p className="text-muted-foreground">
            Sua compra foi processada com sucesso. O acesso ao curso será liberado em instantes após a confirmação do pagamento.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/my-courses">
            <Button className="gap-2 w-full sm:w-auto">
              <BookOpen className="size-4" />
              Ver meus cursos
            </Button>
          </Link>
          <Link href="/courses">
            <Button variant="outline" className="w-full sm:w-auto">Explorar mais cursos</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
