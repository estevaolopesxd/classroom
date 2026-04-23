"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { coursesApi } from "@/lib/api/courses";
import { videosApi } from "@/lib/api/videos";
import type { CourseDetail, Module, Lesson } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { VideoUploader } from "@/components/video/VideoUploader";
import { VideoRecorder } from "@/components/video/VideoRecorder";
import {
  ArrowLeft, Plus, Trash2, GripVertical, ChevronDown, ChevronRight,
  Loader2, Eye, EyeOff, BookOpen, Video, FileText, Save, DollarSign
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CourseEditorPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Forms
  const [courseForm, setCourseForm] = useState({ title: "", description: "", shortDescription: "", level: "", price: "" });
  const [saleEnabled, setSaleEnabled] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);

  // Module dialog
  const [moduleDialog, setModuleDialog] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", isIntro: false });
  const [moduleLoading, setModuleLoading] = useState(false);

  // Lesson dialog
  const [lessonDialog, setLessonDialog] = useState<{ open: boolean; moduleId: string }>({ open: false, moduleId: "" });
  const [lessonForm, setLessonForm] = useState({ title: "", type: "Video", isFreePreview: false, textContent: "" });
  const [lessonLoading, setLessonLoading] = useState(false);

  // Video dialog
  const [videoDialog, setVideoDialog] = useState<{ open: boolean; lesson: Lesson | null }>({ open: false, lesson: null });
  const [videoTab, setVideoTab] = useState<"upload" | "record">("upload");

  const load = useCallback(async () => {
    try {
      const data = await coursesApi.getById(courseId);
      setCourse(data);
      setCourseForm({
        title: data.title,
        description: data.description || "",
        shortDescription: data.shortDescription || "",
        level: data.level || "",
        price: data.price?.toString() || "",
      });
      setSaleEnabled(data.isForSale);
    } catch {
      toast.error("Erro ao carregar curso");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const saveCourse = async () => {
    setSaving(true);
    try {
      await coursesApi.update(courseId, {
        title: courseForm.title,
        description: courseForm.description || undefined,
        shortDescription: courseForm.shortDescription || undefined,
        level: courseForm.level || undefined,
      });
      toast.success("Curso salvo");
      load();
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async () => {
    if (!course) return;
    setSaving(true);
    try {
      if (course.status === "Published") {
        await coursesApi.archive(courseId);
        toast.success("Curso arquivado");
      } else {
        await coursesApi.publish(courseId);
        toast.success("Curso publicado!");
      }
      load();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setSaving(false);
    }
  };

  const saveSaleSettings = async () => {
    setSaleLoading(true);
    try {
      await coursesApi.updateSaleSettings(courseId, {
        isForSale: saleEnabled,
        price: saleEnabled && courseForm.price ? parseFloat(courseForm.price) : undefined,
        currency: "BRL",
      });
      toast.success("Configurações de venda salvas");
      load();
    } catch {
      toast.error("Erro ao salvar configurações de venda");
    } finally {
      setSaleLoading(false);
    }
  };

  const createModule = async () => {
    if (!moduleForm.title) return;
    setModuleLoading(true);
    try {
      await coursesApi.createModule(courseId, { title: moduleForm.title, isIntro: moduleForm.isIntro });
      toast.success("Módulo criado");
      setModuleDialog(false);
      setModuleForm({ title: "", isIntro: false });
      load();
    } catch {
      toast.error("Erro ao criar módulo");
    } finally {
      setModuleLoading(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm("Excluir módulo e todas as aulas?")) return;
    try {
      await coursesApi.deleteModule(courseId, moduleId);
      toast.success("Módulo excluído");
      load();
    } catch {
      toast.error("Erro ao excluir módulo");
    }
  };

  const createLesson = async () => {
    if (!lessonForm.title) return;
    setLessonLoading(true);
    try {
      await coursesApi.createLesson(lessonDialog.moduleId, {
        title: lessonForm.title,
        type: lessonForm.type,
        isFreePreview: lessonForm.isFreePreview,
        textContent: lessonForm.type === "Text" ? lessonForm.textContent : undefined,
      });
      toast.success("Aula criada");
      setLessonDialog({ open: false, moduleId: "" });
      setLessonForm({ title: "", type: "Video", isFreePreview: false, textContent: "" });
      load();
    } catch {
      toast.error("Erro ao criar aula");
    } finally {
      setLessonLoading(false);
    }
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm("Excluir esta aula?")) return;
    try {
      await coursesApi.deleteLesson(moduleId, lessonId);
      toast.success("Aula excluída");
      load();
    } catch {
      toast.error("Erro ao excluir aula");
    }
  };

  const handleVideoReady = async (videoId: string) => {
    if (!videoDialog.lesson) return;
    try {
      await coursesApi.updateLesson(videoDialog.lesson.moduleId, videoDialog.lesson.id, { videoId });
      toast.success("Vídeo vinculado à aula");
      setVideoDialog({ open: false, lesson: null });
      load();
    } catch {
      toast.error("Erro ao vincular vídeo");
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="size-8 animate-spin text-primary" />
    </div>
  );

  if (!course) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin/courses">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold truncate">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={
                course.status === "Published" ? "bg-green-500/20 text-green-500 border-green-500/30" :
                course.status === "Draft" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/30" :
                "bg-muted text-muted-foreground"
              }>
                {course.status === "Published" ? "Publicado" : course.status === "Draft" ? "Rascunho" : "Arquivado"}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          onClick={togglePublish}
          disabled={saving}
          variant={course.status === "Published" ? "outline" : "default"}
          className="gap-2 shrink-0"
        >
          {saving ? <Loader2 className="size-4 animate-spin" /> : course.status === "Published" ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {course.status === "Published" ? "Arquivar" : "Publicar"}
        </Button>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="sale">Venda</TabsTrigger>
        </TabsList>

        {/* CONTENT TAB */}
        <TabsContent value="content" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{course.totalModules} módulos · {course.totalLessons} aulas</p>
            <Button onClick={() => setModuleDialog(true)} size="sm" className="gap-2">
              <Plus className="size-4" /> Novo módulo
            </Button>
          </div>

          <div className="space-y-3">
            {course.modules?.map((mod) => (
              <Card key={mod.id} className="border-border/50">
                <CardHeader className="p-4 pb-0">
                  <div className="flex items-center gap-3">
                    <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="flex items-center gap-2 flex-1 text-left"
                    >
                      {expandedModules.has(mod.id) ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                      <span className="font-medium">{mod.title}</span>
                      {mod.isIntro && <Badge variant="secondary" className="text-xs">Intro</Badge>}
                      <span className="text-xs text-muted-foreground ml-auto">{mod.lessons?.length || 0} aulas</span>
                    </button>
                    <Button
                      variant="ghost" size="icon" className="size-7"
                      onClick={() => deleteModule(mod.id)}
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>

                {expandedModules.has(mod.id) && (
                  <CardContent className="p-4 pt-3 space-y-2">
                    {mod.lessons?.map((lesson) => (
                      <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <GripVertical className="size-4 text-muted-foreground/40 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {lesson.type === "Video" ? <Video className="size-3.5 text-primary shrink-0" /> :
                             lesson.type === "Text" ? <FileText className="size-3.5 text-blue-400 shrink-0" /> :
                             <BookOpen className="size-3.5 text-purple-400 shrink-0" />}
                            <span className="text-sm font-medium truncate">{lesson.title}</span>
                            {lesson.isFreePreview && <Badge variant="outline" className="text-xs shrink-0">Grátis</Badge>}
                          </div>
                          {lesson.type === "Video" && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {lesson.videoId ? "Vídeo vinculado" : "Sem vídeo"}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {lesson.type === "Video" && (
                            <Button
                              variant="ghost" size="sm" className="h-7 text-xs gap-1"
                              onClick={() => setVideoDialog({ open: true, lesson })}
                            >
                              <Video className="size-3" />
                              {lesson.videoId ? "Trocar vídeo" : "Adicionar vídeo"}
                            </Button>
                          )}
                          <Button
                            variant="ghost" size="icon" className="size-7"
                            onClick={() => deleteLesson(mod.id, lesson.id)}
                          >
                            <Trash2 className="size-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <Button
                      variant="outline" size="sm" className="w-full gap-2 mt-2"
                      onClick={() => { setLessonDialog({ open: true, moduleId: mod.id }); }}
                    >
                      <Plus className="size-3.5" /> Nova aula
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}

            {(!course.modules || course.modules.length === 0) && (
              <div className="text-center py-12 border-2 border-dashed border-border/50 rounded-xl">
                <BookOpen className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum módulo ainda.</p>
                <Button onClick={() => setModuleDialog(true)} className="mt-4 gap-2">
                  <Plus className="size-4" /> Criar primeiro módulo
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* INFO TAB */}
        <TabsContent value="info" className="mt-4">
          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descrição curta</Label>
                <Input value={courseForm.shortDescription} onChange={e => setCourseForm(f => ({ ...f, shortDescription: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Descrição completa</Label>
                <Textarea rows={5} value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Nível</Label>
                <Select value={courseForm.level} onValueChange={v => setCourseForm(f => ({ ...f, level: v ?? "" }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Iniciante">Iniciante</SelectItem>
                    <SelectItem value="Intermediário">Intermediário</SelectItem>
                    <SelectItem value="Avançado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={saveCourse} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar alterações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SALE TAB */}
        <TabsContent value="sale" className="mt-4">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="size-4" /> Configurações de venda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl border border-border/50">
                <div>
                  <p className="font-medium">Disponível para venda</p>
                  <p className="text-sm text-muted-foreground">Exibir botão de compra para alunos</p>
                </div>
                <Switch checked={saleEnabled} onCheckedChange={setSaleEnabled} />
              </div>

              {saleEnabled && (
                <div className="space-y-2">
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number" min="0" step="0.01" placeholder="Ex: 97.00"
                    value={courseForm.price}
                    onChange={e => setCourseForm(f => ({ ...f, price: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">O produto será criado/atualizado no Stripe automaticamente.</p>
                </div>
              )}

              {course.isForSale && course.price && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-500">
                  Curso à venda por {new Intl.NumberFormat("pt-BR", { style: "currency", currency: course.currency || "BRL" }).format(course.price)}
                </div>
              )}

              <Button onClick={saveSaleSettings} disabled={saleLoading} className="gap-2">
                {saleLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Module Dialog */}
      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo módulo</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título do módulo</Label>
              <Input
                placeholder="Ex: Introdução"
                value={moduleForm.title}
                onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && createModule()}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={moduleForm.isIntro} onCheckedChange={v => setModuleForm(f => ({ ...f, isIntro: v }))} />
              <Label>Módulo de introdução (acesso gratuito)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialog(false)}>Cancelar</Button>
            <Button onClick={createModule} disabled={moduleLoading || !moduleForm.title}>
              {moduleLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Criar módulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Lesson Dialog */}
      <Dialog open={lessonDialog.open} onOpenChange={(open) => setLessonDialog(d => ({ ...d, open }))}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova aula</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título da aula</Label>
              <Input
                placeholder="Ex: Preparação das unhas"
                value={lessonForm.title}
                onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={lessonForm.type} onValueChange={v => setLessonForm(f => ({ ...f, type: v ?? "Video" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Video">Vídeo</SelectItem>
                  <SelectItem value="Text">Texto</SelectItem>
                  <SelectItem value="LiveStream">Live</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {lessonForm.type === "Text" && (
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea rows={4} value={lessonForm.textContent} onChange={e => setLessonForm(f => ({ ...f, textContent: e.target.value }))} />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Switch checked={lessonForm.isFreePreview} onCheckedChange={v => setLessonForm(f => ({ ...f, isFreePreview: v }))} />
              <Label>Prévia gratuita</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialog({ open: false, moduleId: "" })}>Cancelar</Button>
            <Button onClick={createLesson} disabled={lessonLoading || !lessonForm.title}>
              {lessonLoading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Criar aula
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Video Upload/Record Dialog */}
      <Dialog open={videoDialog.open} onOpenChange={(open) => setVideoDialog(d => ({ ...d, open }))}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Vídeo — {videoDialog.lesson?.title}</DialogTitle>
          </DialogHeader>
          <Tabs value={videoTab} onValueChange={(v) => setVideoTab(v as "upload" | "record")}>
            <TabsList className="w-full">
              <TabsTrigger value="upload" className="flex-1">Upload de arquivo</TabsTrigger>
              <TabsTrigger value="record" className="flex-1">Gravar vídeo</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <VideoUploader onVideoReady={handleVideoReady} />
            </TabsContent>
            <TabsContent value="record" className="mt-4">
              <VideoRecorder onVideoReady={handleVideoReady} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
