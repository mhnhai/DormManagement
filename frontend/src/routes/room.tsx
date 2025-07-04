import React, { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { deleteRoom, getRooms, postRoom, putRoom, Room, RoomStatus } from "~/fetch/room"
import { createFileRoute } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Alert, AlertDescription } from "~/components/ui/alert"
import { Badge } from "~/components/ui/badge"
import { Separator } from "~/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "~/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog"
import {Trash2, Edit, Plus, X, MonitorCog} from "lucide-react"
import RoomTypeManagement from "~/routes/roomtype";
import {getRoomTypes, RoomType} from "~/fetch/roomType";

export const Route = createFileRoute("/room")({
    component: RoomManagement,
})

interface FormErrors {
    RoomTypeID?: string
    RoomNumber?: string
    MaxOccupancy?: string
}

export default function RoomManagement() {
    const queryClient = useQueryClient()

    // Fetch rooms
    const { data: rooms, isLoading, isError } = useQuery({
        queryFn: getRooms,
        queryKey: ["rooms"]
    })

    const { data: roomTypes, isLoading: isLoadingRoomTypes } = useQuery({
        queryFn: getRoomTypes,
        queryKey: ["roomTypes"]
    });

    // Find room type name by ID
    const getRoomTypeName = (roomTypeId: number) => {
        const roomType = roomTypes?.find(type => type.RoomTypeID === roomTypeId);
        return roomType ? roomType.RoomTypeName : `Unknown`;
    };

    // Mutations
    const createRoomMutation = useMutation({
        mutationFn: postRoom,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms"] })
            resetForm()
        },
    })

    const updateRoomMutation = useMutation({
        mutationFn: putRoom,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["rooms"] })
            resetForm()
        },
    })

    const deleteRoomMutation = useMutation({
        mutationFn: deleteRoom,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rooms"] }),
    })

    // State for form inputs
    const [formData, setFormData] = useState<Omit<Room, "RoomID">>({
        RoomTypeID: 0,
        RoomNumber: "",
        MaxOccupancy: 0,
        Status: RoomStatus.Available,
    })
    const [editingRoom, setEditingRoom] = useState<Room | null>(null)
    const [errors, setErrors] = useState<FormErrors>({})
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

    // Validation function
    const validateForm = (): boolean => {
        const newErrors: FormErrors = {}

        if (!formData.RoomNumber.trim()) {
            newErrors.RoomNumber = "Room number is required"
        } else if (formData.RoomNumber.length < 1) {
            newErrors.RoomNumber = "Room number must be at least 1 character"
        }

        if (formData.RoomTypeID <= 0) {
            newErrors.RoomTypeID = "Please select a room type"
        }

        if (formData.MaxOccupancy <= 0) {
            newErrors.MaxOccupancy = "Max occupancy must be greater than 0"
        } else if (formData.MaxOccupancy > 10) {
            newErrors.MaxOccupancy = "Max occupancy cannot exceed 10"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Handlers
    const handleInputChange = (name: string, value: string | number) => {
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }))

        // Clear error when user starts typing
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }))
        }
    }

    const resetForm = () => {
        setFormData({ RoomTypeID: 0, RoomNumber: "", MaxOccupancy: 0, Status: RoomStatus.Available })
        setEditingRoom(null)
        setErrors({})
        setIsCreateDialogOpen(false)
    }

    const handleCreateRoom = () => {
        if (!validateForm()) return
        createRoomMutation.mutate(formData)
    }

    const handleEditRoom = (room: Room) => {
        setEditingRoom(room)
        setFormData({
            RoomTypeID: room.RoomTypeID,
            RoomNumber: room.RoomNumber,
            MaxOccupancy: room.MaxOccupancy,
            Status: room.Status,
        })
        setErrors({})
        setIsCreateDialogOpen(true)
    }

    const handleUpdateRoom = () => {
        if (!validateForm()) return
        if (editingRoom) {
            updateRoomMutation.mutate({ ...editingRoom, ...formData })
        }
    }

    const handleDeleteRoom = (roomID: number) => {
        if (window.confirm("Are you sure you want to delete this room?")) {
            deleteRoomMutation.mutate(roomID)
        }
    }

    const getStatusBadgeVariant = (status: RoomStatus) => {
        return status === RoomStatus.Available ? "default" : "destructive"
    }

    if (isLoading || isLoadingRoomTypes) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg">Loading rooms...</div>
                </div>
            </div>
        )
    }

    if (isError) {
        return (
            <div className="container mx-auto p-4">
                <Alert className="max-w-md mx-auto">
                    <AlertDescription>
                        Error loading rooms. Please try again later.
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="w-full p-6">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage dormitory rooms, their types, and availability status
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    className="flex items-center gap-2"
                                    onClick={() => {
                                        setEditingRoom(null)
                                        setFormData({ RoomTypeID: 0, RoomNumber: "", MaxOccupancy: 0, Status: RoomStatus.Available })
                                        setErrors({})
                                    }}
                                >
                                    <Plus className="h-4 w-4" />
                                    Create New Room
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        {editingRoom ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                        {editingRoom ? "Edit Room" : "Create New Room"}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="roomType">Room Type</Label>
                                            <Select
                                                value={formData.RoomTypeID > 0 ? formData.RoomTypeID.toString() : ""}
                                                onValueChange={(value) => handleInputChange("RoomTypeID", parseInt(value))}
                                            >
                                                <SelectTrigger className={errors.RoomTypeID ? "border-destructive" : ""}>
                                                    <SelectValue placeholder="Select room type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roomTypes?.map((roomType) => (
                                                        <SelectItem
                                                            key={roomType.RoomTypeID}
                                                            value={roomType.RoomTypeID.toString()}
                                                        >
                                                            {roomType.RoomTypeName}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            {errors.RoomTypeID && (
                                                <p className="text-sm text-destructive">{errors.RoomTypeID}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="roomNumber">Room Number</Label>
                                            <Input
                                                id="roomNumber"
                                                type="text"
                                                placeholder="e.g., 101, A-201"
                                                value={formData.RoomNumber}
                                                onChange={(e) => handleInputChange("RoomNumber", e.target.value)}
                                                className={errors.RoomNumber ? "border-destructive" : ""}
                                            />
                                            {errors.RoomNumber && (
                                                <p className="text-sm text-destructive">{errors.RoomNumber}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="maxOccupancy">Max Occupancy</Label>
                                            <Input
                                                id="maxOccupancy"
                                                type="number"
                                                placeholder="Enter max occupancy"
                                                value={formData.MaxOccupancy || ""}
                                                onChange={(e) => handleInputChange("MaxOccupancy", parseInt(e.target.value) || 0)}
                                                className={errors.MaxOccupancy ? "border-destructive" : ""}
                                            />
                                            {errors.MaxOccupancy && (
                                                <p className="text-sm text-destructive">{errors.MaxOccupancy}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="status">Status</Label>
                                            <Select
                                                value={formData.Status}
                                                onValueChange={(value) => handleInputChange("Status", value as RoomStatus)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Available">Available</SelectItem>
                                                    <SelectItem value="Full">Full</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex gap-2">
                                        <Button
                                            onClick={editingRoom ? handleUpdateRoom : handleCreateRoom}
                                            disabled={createRoomMutation.isPending || updateRoomMutation.isPending}
                                            className="flex-1"
                                        >
                                            {editingRoom ? "Update Room" : "Create Room"}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={resetForm}
                                            className="flex items-center gap-2"
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>

                        <Dialog>
                            <DialogTrigger asChild>
                                <Button className="flex items-center gap-2">
                                    <MonitorCog className="h-4 w-4" />
                                    Open Room Type Management
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-2xl max-w-full">
                                <RoomTypeManagement />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            {/* Room List */}
            <Card>
                <CardHeader>
                    <CardTitle>Rooms ({rooms?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                    {rooms?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No rooms found. Create your first room to get started.
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Room Number</TableHead>
                                        <TableHead>Room Type</TableHead>
                                        <TableHead>Max Occupancy</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rooms?.map((room) => (
                                        <TableRow key={room.RoomID}>
                                            <TableCell className="font-medium">{room.RoomNumber}</TableCell>
                                            <TableCell>{getRoomTypeName(room.RoomTypeID)}</TableCell>
                                            <TableCell>{room.MaxOccupancy}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusBadgeVariant(room.Status)}>
                                                    {room.Status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditRoom(room)}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Edit className="h-3 w-3" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteRoom(room.RoomID)}
                                                        disabled={deleteRoomMutation.isPending}
                                                        className="flex items-center gap-1"
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}