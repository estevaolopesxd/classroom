"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="text-center max-w-md space-y-6">
        <div className="size-20 rounded-full bg-muted flex items-center justify-center mx-auto">
          <XCircle className="size-10 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">Compra cancelada</h1>
          <p className="text-muted-foreground">
            Nenhuma cobrança foi realizada. Você pode tentar novamente quando quiser.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/courses">
            <Button className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="size-4" />
              Voltar ao catálogo
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
