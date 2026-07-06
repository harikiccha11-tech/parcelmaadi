"use client";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function CartDrawer({ onCheckout }: { onCheckout: () => void }) {
  const { items, removeItem, updateQty, total, count, isOpen, setIsOpen, clearCart } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full sm:w-96 flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-brand-black">
            <ShoppingBag className="w-5 h-5 text-brand-red" /> Your Cart ({count})
          </SheetTitle>
          <SheetDescription>{count} item{count !== 1 ? "s" : ""} in your cart</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Your cart is empty</p>
            <p className="text-xs text-muted-foreground mt-1">Add products from Supplier/Shop to get started</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto pm-scroll space-y-3 p-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-xl border-2 border-border p-3">
                  {item.image && <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm leading-tight">{item.name}</div>
                    {item.unit && <div className="text-xs text-muted-foreground">{item.unit}</div>}
                    <div className="font-bold text-brand-red text-sm mt-1">₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.id, item.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                      <span className="text-sm font-bold w-8 text-center">{item.quantity}</span>
                      <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => updateQty(item.id, item.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                      <Button size="sm" variant="ghost" className="h-7 ml-auto text-red-500" onClick={() => removeItem(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-extrabold text-brand-red">₹{total}</span>
              </div>
              <Button className="w-full bg-brand-yellow text-brand-black hover:bg-brand-gold font-bold h-12" onClick={() => { setIsOpen(false); onCheckout(); }}>
                Checkout <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => { if (confirm("Clear cart?")) { clearCart(); toast.success("Cart cleared"); } }}>
                Clear cart
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
