"use client";

import { Address } from "@/types/address";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { MapPin, Plus, Check } from "lucide-react";
import { formatCEP } from "@/lib/utils/cep";

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress: (addressId: string) => void;
  onAddNew: () => void;
}

export function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddNew,
}: AddressSelectorProps) {
  const formatAddress = (address: Address) => {
    return `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}, ${formatCEP(address.zip_code)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-secondary">Selecione o Endereço</h3>
        </div>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-6 text-center">
          <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">Você ainda não tem endereços cadastrados</p>
          <Button variant="primary" onClick={onAddNew} className="w-full">
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Cadastrar Endereço</span>
            </div>
          </Button>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className={`p-4 cursor-pointer transition-all ${
                  selectedAddressId === address.id
                    ? "border-2 border-primary bg-primary/5"
                    : "border border-gray-200 hover:border-primary/50"
                }`}
                onClick={() => onSelectAddress(address.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {address.is_default && (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                          Padrão
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-secondary mb-1">
                      {formatAddress(address)}
                    </p>
                    {address.reference && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ref: {address.reference}
                      </p>
                    )}
                  </div>
                  {selectedAddressId === address.id && (
                    <div className="ml-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <Button variant="outline" onClick={onAddNew} className="w-full">
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Cadastrar Novo Endereço</span>
            </div>
          </Button>
        </>
      )}
    </div>
  );
}

