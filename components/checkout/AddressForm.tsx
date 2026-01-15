"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AddressFormData } from "@/types/address";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { isValidBragancaPaulistaCEP, formatCEP, fetchCEPInfo } from "@/lib/utils/cep";
import { MapPin, Loader2 } from "lucide-react";

const addressSchema = z.object({
  zip_code: z.string().min(8, "CEP é obrigatório").refine(
    (cep) => isValidBragancaPaulistaCEP(cep),
    "Apenas entregamos em Bragança Paulista (CEP: 12900-000 a 12929-999)"
  ),
  street: z.string().min(3, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  complement: z.string().optional(),
  neighborhood: z.string().min(2, "Bairro é obrigatório"),
  city: z.string().min(2, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado deve ter 2 caracteres"),
  reference: z.string().optional(),
  is_default: z.boolean().default(false),
});

interface AddressFormProps {
  onSubmit: (data: AddressFormData) => Promise<void>;
  onCancel?: () => void;
  initialData?: AddressFormData;
  isLoading?: boolean;
}

export function AddressForm({ onSubmit, onCancel, initialData, isLoading }: AddressFormProps) {
  const [cepError, setCepError] = useState<string | null>(null);
  const [loadingCEP, setLoadingCEP] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialData || {
      is_default: false,
    },
  });

  const zipCode = watch("zip_code");

  // Buscar informações do CEP quando o usuário digitar um CEP válido
  useEffect(() => {
    const loadCEPInfo = async () => {
      if (!zipCode || zipCode.replace(/\D/g, '').length !== 8) {
        return;
      }

      // Valida se é de Bragança Paulista
      if (!isValidBragancaPaulistaCEP(zipCode)) {
        setCepError("Apenas entregamos em Bragança Paulista (CEP: 12900-000 a 12929-999)");
        return;
      }

      setCepError(null);
      setLoadingCEP(true);

      try {
        const cepInfo = await fetchCEPInfo(zipCode);
        
        if (cepInfo.error) {
          setCepError(cepInfo.error);
        } else {
          if (cepInfo.street) setValue("street", cepInfo.street);
          if (cepInfo.neighborhood) setValue("neighborhood", cepInfo.neighborhood);
          if (cepInfo.city) setValue("city", cepInfo.city);
          if (cepInfo.state) setValue("state", cepInfo.state);
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error);
      } finally {
        setLoadingCEP(false);
      }
    };

    const timeoutId = setTimeout(loadCEPInfo, 500);
    return () => clearTimeout(timeoutId);
  }, [zipCode, setValue]);

  const handleFormSubmit = async (data: AddressFormData) => {
    // Valida CEP novamente antes de submeter
    if (!isValidBragancaPaulistaCEP(data.zip_code)) {
      setCepError("Apenas entregamos em Bragança Paulista (CEP: 12900-000 a 12929-999)");
      return;
    }

    setCepError(null);
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-secondary">Endereço de Entrega</h3>
        </div>

        {/* CEP */}
        <div className="mb-4 relative">
          <Input
            {...register("zip_code")}
            label="CEP *"
            placeholder="12900-000"
            maxLength={9}
            onChange={(e) => {
              const formatted = formatCEP(e.target.value);
              setValue("zip_code", formatted);
            }}
            error={errors.zip_code?.message || cepError || undefined}
            className={loadingCEP ? "pr-10" : ""}
          />
          {loadingCEP && (
            <Loader2 className="absolute right-3 bottom-3 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Rua */}
        <div className="mb-4">
          <Input
            {...register("street")}
            label="Rua *"
            placeholder="Nome da rua"
            error={errors.street?.message}
          />
        </div>

        {/* Número e Complemento */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Input
              {...register("number")}
              label="Número *"
              placeholder="123"
              error={errors.number?.message}
            />
          </div>
          <div>
            <Input
              {...register("complement")}
              label="Complemento"
              placeholder="Apto, Bloco..."
            />
          </div>
        </div>

        {/* Bairro */}
        <div className="mb-4">
          <Input
            {...register("neighborhood")}
            label="Bairro *"
            placeholder="Nome do bairro"
            error={errors.neighborhood?.message}
          />
        </div>

        {/* Cidade e Estado */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="col-span-2">
            <Input
              {...register("city")}
              label="Cidade *"
              placeholder="Bragança Paulista"
              error={errors.city?.message}
            />
          </div>
          <div>
            <Input
              {...register("state")}
              label="Estado *"
              placeholder="SP"
              maxLength={2}
              error={errors.state?.message}
            />
          </div>
        </div>

        {/* Referência */}
        <div className="mb-4">
          <Input
            {...register("reference")}
            label="Ponto de Referência"
            placeholder="Ex: Próximo ao mercado..."
          />
        </div>

        {/* Endereço Padrão */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_default"
            {...register("is_default")}
            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <label htmlFor="is_default" className="text-sm text-secondary">
            Definir como endereço padrão
          </label>
        </div>
      </Card>

      {/* Botões */}
      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          disabled={isLoading || loadingCEP}
        >
          {isLoading ? "Salvando..." : "Continuar"}
        </Button>
      </div>
    </form>
  );
}

