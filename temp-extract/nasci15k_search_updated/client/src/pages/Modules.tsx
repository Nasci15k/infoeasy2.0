import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Loader2, Search, Globe, Wifi, Car, Download } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface ModuleConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  placeholder: string;
  inputType: "ip" | "mac" | "plate";
}

const MODULES: ModuleConfig[] = [
  {
    id: "ip",
    name: "Consulta IP",
    icon: <Globe className="h-6 w-6" />,
    description: "Obtenha informações de geolocalização por endereço IP",
    placeholder: "Digite um IP (ex: 8.8.8.8)",
    inputType: "ip",
  },
  {
    id: "mac",
    name: "Consulta MAC",
    icon: <Wifi className="h-6 w-6" />,
    description: "Identifique o fabricante do MAC Address",
    placeholder: "Digite um MAC (ex: 00:1A:2B:3C:4D:5E)",
    inputType: "mac",
  },
  {
    id: "plate",
    name: "Consulta Placa",
    icon: <Car className="h-6 w-6" />,
    description: "Consulte informações de veículos por placa",
    placeholder: "Digite a placa (ex: ABC1234)",
    inputType: "plate",
  },
];

export default function Modules() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [selectedModule, setSelectedModule] = useState<string>("ip");
  const [searchValue, setSearchValue] = useState<string>("");
  const [selectedApi, setSelectedApi] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<Record<string, unknown> | null>(null);
  const [formattedResult, setFormattedResult] = useState<string>("");

  const module = MODULES.find((m) => m.id === selectedModule);

  // Get available APIs for selected module
  const { data: availableApis, isLoading: apisLoading } = trpc.searchAdvanced.getApisByCategory.useQuery(
    { category: selectedModule },
    { enabled: !!selectedModule }
  );

  // tRPC mutations
  const searchByIp = trpc.searchAdvanced.byIp.useMutation();
  const searchByMac = trpc.searchAdvanced.byMac.useMutation();
  const searchByPlate = trpc.searchAdvanced.byPlate.useMutation();

  const handleDownload = () => {
    if (!formattedResult) {
      toast.error("Nenhum resultado para baixar.");
      return;
    }

    const element = document.createElement("a");
    const file = new Blob([formattedResult], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${selectedModule}_${searchValue.replace(/[^a-z0-9]/gi, "_")}_resultado.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Resultado baixado com sucesso!");
  };

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error("Por favor, insira um valor para buscar");
      return;
    }

    if (!selectedApi) {
      toast.error("Por favor, selecione uma API");
      return;
    }

    setIsSearching(true);
    setSearchResult(null);
    setFormattedResult("");

    try {
      let result;

      switch (selectedModule) {
        case "ip":
          result = await searchByIp.mutateAsync({ ip: searchValue, apiId: selectedApi });
          break;
        case "mac":
          result = await searchByMac.mutateAsync({ mac: searchValue, apiId: selectedApi });
          break;
        case "plate":
          result = await searchByPlate.mutateAsync({ plate: searchValue, apiId: selectedApi });
          break;
        default:
          toast.error("Módulo inválido");
          return;
      }

      if (result.success) {
        setSearchResult(result.data as Record<string, unknown>);
        setFormattedResult(result.formatted);
        toast.success(`Busca concluída com sucesso usando ${result.apiUsed}`);
      } else {
        toast.error("Nenhum resultado encontrado");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao realizar busca");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching) {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Módulos Avançados</h1>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/")}>
            Voltar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Module Selection */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {MODULES.map((m) => (
            <Card
              key={m.id}
              className={`border-2 cursor-pointer transition-all ${
                selectedModule === m.id
                  ? "border-blue-500 bg-blue-950"
                  : "border-slate-700 bg-slate-800 hover:border-slate-600"
              }`}
              onClick={() => {
                setSelectedModule(m.id);
                setSelectedApi("");
                setSearchResult(null);
                setFormattedResult("");
              }}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-blue-400">{m.icon}</div>
                  <CardTitle className="text-white">{m.name}</CardTitle>
                </div>
                <CardDescription>{m.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Search Card */}
        {module && (
          <Card className="max-w-2xl mx-auto mb-8 border-slate-700 bg-slate-800">
            <CardHeader>
              <CardTitle className="text-white">{module.name}</CardTitle>
              <CardDescription>Selecione a API e insira o valor para buscar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* API Selection */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Selecione a API
                </label>
                <Select value={selectedApi} onValueChange={setSelectedApi} disabled={apisLoading}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Carregando APIs..." />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    {availableApis?.map((api) => (
                      <SelectItem key={api.id} value={api.id} className="text-white">
                        <div>
                          <div className="font-medium">{api.name}</div>
                          <div className="text-xs text-slate-400">{api.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Valor para buscar
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder={module.placeholder}
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isSearching || !selectedApi}
                    className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={isSearching || !searchValue.trim() || !selectedApi}
                    className="gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    {isSearching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4" />
                        Buscar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {formattedResult && (
          <div className="max-w-4xl mx-auto space-y-4">
            <Card className="border-slate-700 bg-slate-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">Resultado Formatado</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="text-white border-slate-600 hover:bg-slate-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Resultado
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-900 p-6 rounded text-slate-300 whitespace-pre-wrap font-mono text-sm">
                  {String(formattedResult)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
