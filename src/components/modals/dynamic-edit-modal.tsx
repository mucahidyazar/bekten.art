'use client'

import Image from 'next/image'

import {
  Check,
  Edit,
  Grid3X3,
  GripVertical,
  Image as ImageIcon,
  Plus,
  Save,
  Settings,
  Table,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import React, {useState} from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {
  TableBody,
  TableCell,
  Table as TableComponent,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Textarea} from '@/components/ui/textarea'

// Utility function to get nested property value
const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Utility function to set nested property value
const setNestedValue = (obj: any, path: string, value: any): any => {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}

    return current[key]
  }, obj)

  target[lastKey] = value

  return obj
}

export function DynamicEditModal<
  TItem extends DynamicItem,
  TSettings extends DynamicSettings,
>({
  items: initialItems,
  settings: initialSettings,
  title,
  description,
  icon,
  itemFields,
  settingsFields = defaultSettingsFields,
  viewConfig,
  maxItems,
  onSave,
  onImageSelect,
  onImageSelected,
  trigger,
  viewType = 'card',
  createNewItem,
  validateItem: _validateItem,
}: DynamicEditModalProps<TItem, TSettings>) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<TItem[]>(initialItems)
  const [currentSettings, setCurrentSettings] =
    useState<TSettings>(initialSettings)
  const [editingItem, setEditingItem] = useState<Partial<TItem> | null>(null)
  const [inlineEditingIndex, setInlineEditingIndex] = useState<number>(-1)
  const [isLoading, setIsLoading] = useState(false)
  const [currentViewType, setCurrentViewType] = useState<'card' | 'table'>(
    viewConfig.card ? viewType : 'table',
  )

  // const _handleItemSubmit = async (data: Partial<TItem>) => {
  //   if (editingIndex >= 0) {
  //     // Update existing item
  //     const updatedItems = [...items]

  //     updatedItems[editingIndex] = {
  //       ...updatedItems[editingIndex],
  //       ...data,
  //     }
  //     setItems(updatedItems)
  //   } else {
  //     // Add new item
  //     const newItem = createNewItem(data)

  //     setItems([...items, newItem])
  //   }

  //   setEditingItem(null)
  //   setEditingIndex(-1)
  //   setInlineEditingIndex(-1)
  // }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await onSave({
        items: items.map((item, index) => ({
          ...item,
          order: index,
        })),
        settings: currentSettings,
      })
      setOpen(false)
    } catch (error) {
      console.error('Failed to save data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // const _handleEditItem = (item: TItem, index: number) => {
  //   setEditingItem(item)
  //   setEditingIndex(index)
  // }

  const handleInlineEdit = (index: number) => {
    setInlineEditingIndex(index)
    setEditingItem({...items[index]})
  }

  const handleInlineSave = () => {
    if (editingItem && inlineEditingIndex >= 0) {
      const updatedItems = [...items]

      updatedItems[inlineEditingIndex] = editingItem as TItem
      setItems(updatedItems)
    }
    setInlineEditingIndex(-1)
    setEditingItem(null)
  }

  const handleInlineCancel = () => {
    // If we're canceling a new item (temp item), remove it from the array
    if (
      inlineEditingIndex >= 0 &&
      editingItem &&
      editingItem.id?.startsWith('temp-')
    ) {
      const updatedItems = items.filter((_, i) => i !== inlineEditingIndex)

      setItems(updatedItems)
    }

    setInlineEditingIndex(-1)
    setEditingItem(null)
  }

  const handleAddItem = () => {
    const newItemTemplate: Partial<TItem> = {}

    itemFields.forEach(field => {
      if (field.type === 'number') {
        newItemTemplate[field.name as keyof TItem] = 0 as any
      } else if (field.type === 'json') {
        newItemTemplate[field.name as keyof TItem] = {} as any
      } else {
        newItemTemplate[field.name as keyof TItem] = '' as any
      }
    })

    // Add the new item to the items array temporarily for inline editing
    const tempItem = createNewItem(newItemTemplate)
    const newItems = [...items, tempItem]

    setItems(newItems)

    // Set inline editing for the new item (last index)
    setEditingItem(tempItem)
    setInlineEditingIndex(newItems.length - 1)

    console.log('Adding new item with template:', newItemTemplate) // Debug log
  }

  const handleDeleteItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index)

    setItems(updatedItems)
  }

  // const _handleMoveItem = (fromIndex: number, toIndex: number) => {
  //   const updatedItems = [...items]
  //   const [movedItem] = updatedItems.splice(fromIndex, 1)

  //   updatedItems.splice(toIndex, 0, movedItem)
  //   setItems(updatedItems)
  // }

  const handleImageSelectClick = (fieldName: string) => {
    if (onImageSelected) {
      // Create a callback to update the field when image is selected
      const updateCallback = (imageUrl: string) => {
        handleFieldChange(fieldName, imageUrl)
      }

      onImageSelected('', fieldName, updateCallback)
    } else if (onImageSelect) {
      onImageSelect(fieldName)
    }
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    if (editingItem) {
      const updatedItem = {...editingItem}

      setNestedValue(updatedItem, fieldName, value)
      setEditingItem(updatedItem)
    }
  }

  const handleSettingsChange = (fieldName: string, value: any) => {
    setCurrentSettings({
      ...currentSettings,
      [fieldName]: value,
    })
  }

  const renderFieldInput = (
    field: FieldConfig,
    value: any,
    onChange: (value: any) => void,
  ) => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="border-border/30 focus:border-primary/50 min-h-[60px] resize-none text-xs transition-colors"
            rows={2}
          />
        )

      case 'json':
        return (
          <Textarea
            value={
              typeof value === 'object'
                ? JSON.stringify(value, null, 2)
                : value || '{}'
            }
            onChange={e => {
              try {
                const parsed = JSON.parse(e.target.value)

                onChange(parsed)
              } catch {
                // Keep the raw string if invalid JSON
                onChange(e.target.value)
              }
            }}
            placeholder={field.placeholder || '{}'}
            className="border-border/30 focus:border-primary/50 min-h-[100px] resize-none font-mono text-xs transition-colors"
            rows={4}
          />
        )
      case 'image':
        return (
          <div className="flex items-center gap-2">
            <Input
              value={value || ''}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              className="border-border/30 focus:border-primary/50 flex-1 text-sm transition-colors"
            />
            {onImageSelect && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleImageSelectClick(field.name)}
                className="px-3"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="border-border/30 focus:border-primary/50 text-sm transition-colors"
          />
        )
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="border-border/30 focus:border-primary/50 bg-background w-full rounded-md border px-3 py-2 text-sm transition-colors"
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      default:
        return (
          <Input
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="border-border/30 focus:border-primary/50 text-sm transition-colors"
          />
        )
    }
  }

  const renderCardView = () => {
    if (!viewConfig.card) return null

    const cardConfig = viewConfig.card

    return (
      <div className="grid auto-rows-max grid-cols-1 gap-6 overflow-y-auto p-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => (
          <Card
            key={item.id || index}
            className={`group border-border/20 from-card/80 to-card/40 hover:shadow-primary/10 relative w-full overflow-hidden rounded-2xl border bg-gradient-to-br shadow-lg backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 ${
              inlineEditingIndex === index ? 'ring-primary/50 ring-2' : ''
            }`}
            style={{aspectRatio: cardConfig.aspectRatio || '160/240'}}
          >
            {/* Hover Actions */}
            <div
              className={`absolute top-2 right-2 z-10 flex gap-1 transition-all duration-300 ${
                inlineEditingIndex === index
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {inlineEditingIndex === index ? (
                <>
                  <div
                    onClick={handleInlineCancel}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-red-600/20"
                  >
                    <X className="h-4 w-4 text-white/80" />
                  </div>
                  <div
                    onClick={handleInlineSave}
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-green-600/20"
                  >
                    <Check className="h-4 w-4 text-white/80" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all duration-200 hover:cursor-grabbing hover:bg-white/10">
                    <GripVertical className="h-4 w-4 text-white/80" />
                  </div>
                  <div
                    onClick={() => handleInlineEdit(index)}
                    className="hover:bg-primary/20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110"
                  >
                    <Edit className="h-4 w-4 text-white/80" />
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-red-600/20">
                        <Trash2 className="h-4 w-4 text-white/80" />
                      </div>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-destructive/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                          Remove Item
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove "
                          {item[cardConfig.titleField] || 'this item'}" from
                          your collection? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-border/50">
                          Keep it
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteItem(index)}
                          className="from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 bg-gradient-to-r"
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>

            <CardContent className="relative flex h-full flex-col p-0">
              {inlineEditingIndex === index ? (
                // Inline Edit Mode
                <div className="flex h-full flex-col">
                  <div className="relative min-h-[272px] flex-grow overflow-hidden">
                    {editingItem?.[cardConfig.imageField] ? (
                      <Image
                        src={editingItem[cardConfig.imageField] as string}
                        alt="Preview"
                        fill
                        className="object-cover"
                        onError={e => {
                          const target = e.target as HTMLImageElement

                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                        {cardConfig.placeholderIcon || (
                          <ImageIcon className="text-muted-foreground/60 h-8 w-8" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <Input
                      value={
                        getNestedValue(editingItem, cardConfig.titleField) || ''
                      }
                      onChange={e =>
                        handleFieldChange(cardConfig.titleField, e.target.value)
                      }
                      placeholder="Title..."
                      className="text-foreground/90 mb-1 h-[20px] border-none bg-transparent p-0 text-sm font-semibold shadow-none focus-visible:ring-0"
                    />
                    <Textarea
                      value={
                        getNestedValue(
                          editingItem,
                          cardConfig.descriptionField,
                        ) || ''
                      }
                      onChange={e =>
                        handleFieldChange(
                          cardConfig.descriptionField,
                          e.target.value,
                        )
                      }
                      placeholder="Description..."
                      className="text-muted-foreground/80 resize-none border-none bg-transparent p-0 text-xs shadow-none focus-visible:ring-0"
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                // Normal View Mode
                <>
                  <div className="relative min-h-[272px] flex-grow overflow-hidden">
                    {getNestedValue(item, cardConfig.imageField) ? (
                      <Image
                        src={getNestedValue(item, cardConfig.imageField)}
                        alt={
                          getNestedValue(item, cardConfig.titleField) ||
                          'Item image'
                        }
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={e => {
                          const target = e.target as HTMLImageElement

                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                        {cardConfig.placeholderIcon || (
                          <ImageIcon className="text-muted-foreground/60 h-8 w-8" />
                        )}
                      </div>
                    )}
                    {/* Decorative overlay */}
                    <div className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 backdrop-blur-sm transition-transform duration-500 group-hover:rotate-90">
                      {cardConfig.placeholderIcon || (
                        <ImageIcon className="h-4 w-4 text-white/80" />
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-foreground/90 group-hover:text-primary mb-1 line-clamp-2 text-sm font-semibold transition-colors duration-300">
                      {getNestedValue(item, cardConfig.titleField) ||
                        'Untitled'}
                    </h4>
                    <p className="text-muted-foreground/80 line-clamp-2 text-xs">
                      {getNestedValue(item, cardConfig.descriptionField) ||
                        'No description'}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const renderTableView = () => (
    <div className="overflow-y-auto p-4">
      <TableComponent>
        <TableHeader>
          <TableRow className="border-border/20 hover:bg-muted/30">
            {viewConfig.table.columns.map(column => (
              <TableHead key={column.field} className={column.width}>
                {column.label}
              </TableHead>
            ))}
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow
              key={item.id || index}
              className={`border-border/20 hover:bg-muted/20 transition-colors ${
                inlineEditingIndex === index
                  ? 'bg-primary/5 border-primary/20'
                  : ''
              }`}
            >
              {viewConfig.table.columns.map(column => (
                <TableCell key={column.field} className="p-2">
                  {column.type === 'image' ? (
                    <div className="border-border/20 relative h-16 w-16 overflow-hidden rounded-lg border">
                      {inlineEditingIndex === index ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleImageSelectClick(column.field)}
                            className="h-full w-full p-1"
                          >
                            <ImageIcon className="text-muted-foreground h-6 w-6" />
                          </Button>
                        </div>
                      ) : getNestedValue(item, column.field) ? (
                        <Image
                          src={getNestedValue(item, column.field)}
                          alt={
                            getNestedValue(
                              item,
                              viewConfig.card?.titleField || 'data.name',
                            ) || 'Item image'
                          }
                          fill
                          className="object-cover"
                          onError={e => {
                            const target = e.target as HTMLImageElement

                            target.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="bg-muted/50 flex h-full w-full items-center justify-center">
                          <ImageIcon className="text-muted-foreground/60 h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ) : inlineEditingIndex === index ? (
                    column.type === 'textarea' ? (
                      <Textarea
                        value={getNestedValue(editingItem, column.field) || ''}
                        onChange={e =>
                          handleFieldChange(column.field, e.target.value)
                        }
                        placeholder={`Enter ${column.label.toLowerCase()}...`}
                        className="border-border/30 focus:border-primary/50 min-h-[60px] resize-none text-xs transition-colors"
                        rows={2}
                      />
                    ) : column.type === 'json' ? (
                      <Textarea
                        value={
                          typeof editingItem?.[column.field] === 'object'
                            ? JSON.stringify(
                                editingItem?.[column.field],
                                null,
                                2,
                              )
                            : editingItem?.[column.field] || '{}'
                        }
                        onChange={e => {
                          try {
                            const parsed = JSON.parse(e.target.value)

                            handleFieldChange(column.field, parsed)
                          } catch {
                            handleFieldChange(column.field, e.target.value)
                          }
                        }}
                        placeholder={`Enter ${column.label.toLowerCase()}...`}
                        className="border-border/30 focus:border-primary/50 min-h-[80px] resize-none font-mono text-xs transition-colors"
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={getNestedValue(editingItem, column.field) || ''}
                        onChange={e =>
                          handleFieldChange(column.field, e.target.value)
                        }
                        placeholder={`Enter ${column.label.toLowerCase()}...`}
                        className="border-border/30 focus:border-primary/50 h-8 text-sm transition-colors"
                      />
                    )
                  ) : (
                    <span
                      className={`${column.type === 'textarea' || column.type === 'json' ? 'text-muted-foreground/80 text-xs' : 'text-foreground/90 text-sm font-medium'}`}
                    >
                      {column.type === 'json'
                        ? typeof getNestedValue(item, column.field) === 'object'
                          ? JSON.stringify(getNestedValue(item, column.field))
                          : getNestedValue(item, column.field) || '{}'
                        : getNestedValue(item, column.field) ||
                          `No ${column.label.toLowerCase()}`}
                    </span>
                  )}
                </TableCell>
              ))}

              {/* Actions Column */}
              <TableCell className="p-2">
                <div className="flex items-center justify-end gap-1">
                  {inlineEditingIndex === index ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleInlineCancel}
                        className="h-8 w-8 p-0 hover:bg-red-600/10"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleInlineSave}
                        className="h-8 w-8 p-0 hover:bg-green-600/10"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInlineEdit(index)}
                        className="hover:bg-primary/10 h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-600/10"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-destructive/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-destructive">
                              Remove Item
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to remove "
                              {item[viewConfig.card?.titleField || 'id'] ||
                                'this item'}
                              " from your collection? This action cannot be
                              undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-border/50">
                              Keep it
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItem(index)}
                              className="from-destructive to-destructive/80 hover:from-destructive/90 hover:to-destructive/70 bg-gradient-to-r"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableComponent>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="border-border/50 hover:bg-primary/5 hover:border-primary/50 gap-2 transition-all duration-200"
          >
            {icon}
            <span className="font-medium">Edit {title}</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="border-border/20 from-background via-background to-background/95 flex max-h-[95vh] max-w-7xl flex-col gap-0 overflow-hidden bg-gradient-to-br p-0 shadow-2xl backdrop-blur-xl md:min-w-[800px]">
        <DialogHeader className="flex-shrink-0">
          <div className="from-primary/20 via-primary/10 relative overflow-hidden rounded-t-xl bg-gradient-to-r to-purple-500/10 p-6">
            <div className="bg-grid-white/[0.02] bg-grid-16 absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
            <div className="relative flex items-center gap-4">
              <div className="from-primary rounded-xl bg-gradient-to-br to-purple-600 p-3 shadow-lg">
                {icon}
              </div>
              <div className="space-y-1">
                <DialogTitle className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-2xl font-bold text-transparent">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground/80 text-sm leading-relaxed">
                  {description}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs
          defaultValue="items"
          className="flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="m-4 grid w-auto grid-cols-2">
            <TabsTrigger value="items" className="flex items-center gap-2 px-4">
              <div className="rounded-md bg-gradient-to-br from-blue-500 to-blue-600 p-1">
                <ImageIcon className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium">Items</span>
              <Badge variant="secondary" className="ml-1 h-5 px-2 text-xs">
                {items.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center gap-2 px-4"
            >
              <div className="rounded-md bg-gradient-to-br from-purple-500 to-purple-600 p-1">
                <Settings className="h-3 w-3 text-white" />
              </div>
              <span className="font-medium">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="items"
            className="mt-0 flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                {/* View Toggle Buttons - Only show if card config is available */}
                {viewConfig.card && (
                  <div className="border-border/20 bg-muted/20 flex items-center rounded-lg border p-1">
                    <Button
                      variant={currentViewType === 'card' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setCurrentViewType('card')}
                      className={`h-8 px-3 ${
                        currentViewType === 'card'
                          ? 'from-primary to-primary/80 bg-gradient-to-r text-white shadow-sm'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Grid3X3 className="mr-1.5 h-4 w-4" />
                      <span className="text-xs font-medium">Cards</span>
                    </Button>
                    <Button
                      variant={
                        currentViewType === 'table' ? 'default' : 'ghost'
                      }
                      size="sm"
                      onClick={() => setCurrentViewType('table')}
                      className={`h-8 px-3 ${
                        currentViewType === 'table'
                          ? 'from-primary to-primary/80 bg-gradient-to-r text-white shadow-sm'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <Table className="mr-1.5 h-4 w-4" />
                      <span className="text-xs font-medium">Table</span>
                    </Button>
                  </div>
                )}
              </div>
              <Button
                onClick={handleAddItem}
                disabled={maxItems ? items.length >= maxItems : false}
                className="from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 h-10 gap-2 bg-gradient-to-r whitespace-nowrap shadow-lg transition-all duration-200 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">
                  {maxItems && items.length >= maxItems
                    ? `Max ${maxItems} Items`
                    : 'Add Item'}
                </span>
              </Button>
            </div>

            {/* Conditional View Rendering */}
            {currentViewType === 'card' && viewConfig.card
              ? renderCardView()
              : renderTableView()}

            {items.length === 0 && (
              <Card className="border-border/20 from-muted/20 to-muted/5 border-2 border-dashed bg-gradient-to-br">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="from-primary/10 mb-6 rounded-2xl bg-gradient-to-br to-purple-500/10 p-6 shadow-lg">
                    {icon}
                  </div>
                  <h3 className="from-foreground to-foreground/70 mb-3 bg-gradient-to-r bg-clip-text text-xl font-bold text-transparent">
                    Your Collection Awaits
                  </h3>
                  <p className="text-muted-foreground/80 mb-8 max-w-md text-center leading-relaxed">
                    Start building your collection by adding your first item.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent
            value="settings"
            className="mt-0 flex flex-1 flex-col overflow-hidden p-4"
          >
            <div className="mb-6">
              <h3 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-lg font-bold text-transparent">
                Configuration
              </h3>
              <p className="text-muted-foreground/80 text-sm leading-relaxed">
                Customize your collection settings and behavior
              </p>
            </div>

            <div className="flex-1 space-y-4">
              <div className="space-y-4">
                {settingsFields.map(field => (
                  <Card
                    key={field.name}
                    className="border-border/20 from-card to-card/95 bg-gradient-to-r p-4"
                  >
                    <div className="space-y-3">
                      <label className="text-foreground/90 flex items-center gap-2 text-sm font-semibold">
                        {field.icon && (
                          <div className="rounded-md bg-gradient-to-br from-blue-500 to-blue-600 p-1">
                            {field.icon}
                          </div>
                        )}
                        {field.label}
                      </label>
                      {renderFieldInput(
                        field,
                        currentSettings[field.name],
                        value => handleSettingsChange(field.name, value),
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex flex-shrink-0 items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="border-border/30 bg-muted/30 flex h-10 items-center gap-2.5 rounded-lg border px-3">
              <div className="bg-primary flex h-6 w-6 items-center justify-center rounded-md">
                {icon ? (
                  <div className="text-primary-foreground [&>svg]:h-4 [&>svg]:w-4">
                    {icon}
                  </div>
                ) : (
                  <ImageIcon className="text-primary-foreground h-4 w-4" />
                )}
              </div>
              <span className="text-foreground text-sm font-medium">
                {items.length} item{items.length !== 1 ? 's' : ''} ready
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-border/50 hover:bg-muted/50 gap-2 transition-all duration-200"
            >
              <X className="h-4 w-4" />
              <span className="font-medium">Cancel</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 gap-2 bg-gradient-to-r shadow-lg transition-all duration-300 hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="font-medium">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="font-medium">Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export type DynamicEditModalProps<
  TItem extends DynamicItem,
  TSettings extends DynamicSettings,
> = {
  // Data
  items: TItem[]
  settings: TSettings

  // Configuration
  title: string
  description: string
  icon?: React.ReactNode
  itemFields: FieldConfig[]
  settingsFields?: SettingsFieldConfig[] // Optional, uses defaults if not provided
  viewConfig: ViewConfig
  maxItems?: number // Maximum number of items allowed

  // Behavior
  onSave: (data: {items: TItem[]; settings: TSettings}) => Promise<void>
  onImageSelect?: (fieldName: string) => void
  onImageSelected?: (
    imageUrl: string,
    fieldName: string,
    updateCallback?: (url: string) => void,
  ) => void

  // UI
  trigger?: React.ReactNode
  viewType?: 'card' | 'table'

  // Item creation
  createNewItem: (data: Partial<TItem>) => TItem

  // Validation
  validateItem?: (item: TItem) => boolean
}

// Generic types for the dynamic modal
export type DynamicItem = {
  id?: string
  [key: string]: any // Allow any additional properties
}

export type DynamicSettings = {
  [key: string]: any // Allow any settings structure
}

// Default settings fields that are common across all sections
const defaultSettingsFields: SettingsFieldConfig[] = [
  {
    name: 'section_title',
    label: 'Section Title',
    type: 'text',
    placeholder: 'Enter a compelling section title...',
    icon: <Settings className="h-3 w-3 text-white" />,
  },
  {
    name: 'section_description',
    label: 'Section Description',
    type: 'textarea',
    placeholder: 'Describe your section and its unique features...',
    icon: <Edit className="h-3 w-3 text-white" />,
  },
  {
    name: 'badge_text',
    label: 'Badge Text',
    type: 'text',
    placeholder: "Add a special badge (e.g., 'Featured', 'New Collection')",
    icon: <Zap className="h-3 w-3 text-white" />,
  },
  {
    name: 'max_items',
    label: 'Maximum Items',
    type: 'number',
    placeholder: '6',
    icon: <ImageIcon className="h-3 w-3 text-white" />,
  },
]

export type FieldConfig = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'image' | 'number' | 'select' | 'json'
  placeholder?: string
  required?: boolean
  options?: {value: string; label: string}[] // For select fields
}

export type SettingsFieldConfig = {
  name: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'select'
  placeholder?: string
  icon?: React.ReactNode
  options?: {value: string; label: string}[]
}

export type ViewConfig = {
  card?: {
    aspectRatio?: string
    imageField: string
    titleField: string
    descriptionField: string
    placeholderIcon?: React.ReactNode
  }
  table: {
    columns: {
      field: string
      label: string
      width?: string
      type: 'image' | 'text' | 'textarea' | 'json'
    }[]
  }
}
