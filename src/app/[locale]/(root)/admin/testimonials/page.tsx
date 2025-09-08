'use client'

import Image from 'next/image'

import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  SearchIcon,
  FilterIcon,
  MoreVerticalIcon,
  StarIcon,
  MessageSquareIcon,
  UserIcon,
  MapPinIcon,
} from 'lucide-react'
import {useState} from 'react'

import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {Textarea} from '@/components/ui/textarea'
import {testimonialsData} from '@/mocks/testimonials'

const categoryLabels = {
  artist: 'Sanatçı',
  businessman: 'İş İnsanı',
  politician: 'Devlet Adamı',
  collector: 'Koleksiyoner',
  critic: 'Sanat Eleştirmeni',
}

const categoryColors = {
  artist:
    'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  businessman:
    'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  politician:
    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  collector:
    'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  critic: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
}

export default function TestimonialsAdminPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedTestimonial, setSelectedTestimonial] = useState<any>(null)

  // Filter testimonials
  const filteredTestimonials = testimonialsData.filter(testimonial => {
    const matchesSearch =
      testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.quote.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.title.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || testimonial.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  const handleEdit = (testimonial: any) => {
    setSelectedTestimonial(testimonial)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (id: number) => {
    // TODO: Implement delete functionality
    console.log('Delete testimonial:', id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Testimonials Yönetimi
          </h1>
          <p className="text-muted-foreground">
            Sanatçı hakkındaki değerli görüşleri yönetin
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <PlusIcon className="mr-2 h-4 w-4" />
                Yeni Testimonial
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Yeni Testimonial Ekle</DialogTitle>
                <DialogDescription>
                  Yeni bir testimonial eklemek için aşağıdaki formu doldurun.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">İsim</Label>
                    <Input id="name" placeholder="Kişinin tam adı" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Ünvan</Label>
                    <Input id="title" placeholder="Meslek / Pozisyon" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Şirket/Kurum</Label>
                    <Input id="company" placeholder="Çalıştığı kurum" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Konum</Label>
                    <Input id="location" placeholder="Şehir, Ülke" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quote">Testimonial</Label>
                  <Textarea
                    id="quote"
                    placeholder="Sanatçı hakkındaki görüşleri..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">Profil Resmi URL</Label>
                  <Input
                    id="avatar"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  İptal
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(false)}>
                  Ekle
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Testimonial
            </CardTitle>
            <MessageSquareIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{testimonialsData.length}</div>
            <p className="text-muted-foreground text-xs">
              Aktif testimonial sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Puan</CardTitle>
            <StarIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5.0</div>
            <p className="text-muted-foreground text-xs">
              Mükemmel değerlendirme
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategoriler</CardTitle>
            <FilterIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(categoryLabels).length}
            </div>
            <p className="text-muted-foreground text-xs">Farklı kategori</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Son Güncelleme
            </CardTitle>
            <UserIcon className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2 gün</div>
            <p className="text-muted-foreground text-xs">önce güncellendi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="İsim, ünvan veya testimonial'da arama yapın..."
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Testimonials Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredTestimonials.map(testimonial => (
          <Card
            key={testimonial.id}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Image
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="ring-primary/10 rounded-full object-cover ring-2"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">
                      {testimonial.name}
                    </h3>
                    <p className="text-muted-foreground truncate text-sm">
                      {testimonial.title}
                    </p>
                    {testimonial.company && (
                      <p className="text-muted-foreground truncate text-xs">
                        {testimonial.company}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreVerticalIcon className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(testimonial)}>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Düzenle
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(testimonial.id)}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={categoryColors[testimonial.category]}>
                  {categoryLabels[testimonial.category]}
                </Badge>
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="text-muted-foreground h-3 w-3" />
                  <span className="text-muted-foreground text-xs">
                    {testimonial.location}
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <blockquote className="text-muted-foreground line-clamp-4 text-sm leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  {Array.from({length: testimonial.rating}).map((_, i) => (
                    <StarIcon
                      key={i}
                      className="h-3 w-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span className="text-muted-foreground text-xs">
                  ID: {testimonial.id}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTestimonials.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <MessageSquareIcon className="text-muted-foreground/50 mx-auto h-12 w-12" />
            <h3 className="mt-4 text-lg font-semibold">
              Testimonial bulunamadı
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Aradığınız kriterlere uygun testimonial bulunamadı. Filtreleri
              değiştirmeyi deneyin.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Testimonial Düzenle</DialogTitle>
            <DialogDescription>
              Seçili testimonial'ı düzenlemek için aşağıdaki formu kullanın.
            </DialogDescription>
          </DialogHeader>

          {selectedTestimonial && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">İsim</Label>
                  <Input
                    id="edit-name"
                    defaultValue={selectedTestimonial.name}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-title">Ünvan</Label>
                  <Input
                    id="edit-title"
                    defaultValue={selectedTestimonial.title}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-company">Şirket/Kurum</Label>
                  <Input
                    id="edit-company"
                    defaultValue={selectedTestimonial.company || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Konum</Label>
                  <Input
                    id="edit-location"
                    defaultValue={selectedTestimonial.location}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Kategori</Label>
                <Select defaultValue={selectedTestimonial.category}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-quote">Testimonial</Label>
                <Textarea
                  id="edit-quote"
                  defaultValue={selectedTestimonial.quote}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-avatar">Profil Resmi URL</Label>
                <Input
                  id="edit-avatar"
                  defaultValue={selectedTestimonial.avatar}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              İptal
            </Button>
            <Button onClick={() => setIsEditDialogOpen(false)}>Güncelle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
