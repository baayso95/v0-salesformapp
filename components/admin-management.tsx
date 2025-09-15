"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { useConfirmation } from "@/components/confirmation-dialog" // Added useConfirmation hook
import { useAlert } from "@/components/alert-dialog-provider" // Added useAlert hook
import { UserPlus, Edit, Trash2, Users, Shield, User, Eye, EyeOff, UserCheck, UserX, Smartphone } from "lucide-react"

export function AdminManagement() {
  const {
    users,
    createUser,
    updateUser,
    deleteUser,
    toggleUserActive,
    toggle2FA,
    username: currentUsername,
  } = useAuth()

  console.log("[v0] Total users:", users.length)
  console.log("[v0] Users data:", users)

  const { confirm } = useConfirmation()
  const { showAlert } = useAlert()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({})

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "user" as "admin" | "user",
  })

  const handleCreateUser = async () => {
    if (
      !formData.username ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.email
    ) {
      await showAlert({
        title: "Champs manquants",
        message: "Veuillez remplir tous les champs",
        variant: "warning",
      })
      return
    }

    console.log("[v0] Creating user with data:", formData)

    const success = createUser(
      formData.username,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.phone,
      formData.email,
      formData.role,
    )

    console.log("[v0] User creation result:", success)

    if (success) {
      setFormData({ username: "", password: "", firstName: "", lastName: "", phone: "", email: "", role: "user" })
      setShowCreateForm(false)
      await showAlert({
        title: "Succès",
        message: "Utilisateur créé avec succès!",
        variant: "success",
      })
    } else {
      await showAlert({
        title: "Erreur",
        message: "Vérifiez que tous les champs sont correctement remplis et que le nom d'utilisateur n'existe pas déjà",
        variant: "error",
      })
    }
  }

  const handleUpdateUser = async (userId: string) => {
    if (
      !formData.username ||
      !formData.password ||
      !formData.firstName ||
      !formData.lastName ||
      !formData.phone ||
      !formData.email
    ) {
      await showAlert({
        title: "Champs manquants",
        message: "Veuillez remplir tous les champs",
        variant: "warning",
      })
      return
    }

    const success = updateUser(userId, {
      username: formData.username,
      password: formData.password,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      role: formData.role,
    })

    if (success) {
      setFormData({ username: "", password: "", firstName: "", lastName: "", phone: "", email: "", role: "user" })
      setEditingUser(null)
      await showAlert({
        title: "Succès",
        message: "Utilisateur modifié avec succès!",
        variant: "success",
      })
    } else {
      await showAlert({
        title: "Erreur",
        message: "Vérifiez que tous les champs sont correctement remplis et que le nom d'utilisateur n'existe pas déjà",
        variant: "error",
      })
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (username === currentUsername) {
      await showAlert({
        title: "Action interdite",
        message: "Vous ne pouvez pas supprimer votre propre compte",
        variant: "warning",
      })
      return
    }

    const confirmed = await confirm({
      title: "Supprimer l'utilisateur",
      description: `Êtes-vous sûr de vouloir supprimer l'utilisateur "${username}" ? Cette action est irréversible.`,
      variant: "destructive",
      icon: "delete",
      confirmText: "Supprimer",
      cancelText: "Annuler",
    })

    if (confirmed) {
      deleteUser(userId)
      await showAlert({
        title: "Succès",
        message: "Utilisateur supprimé avec succès!",
        variant: "success",
      })
    }
  }

  const handleToggleActive = async (userId: string, username: string, isActive: boolean) => {
    if (username === currentUsername && isActive) {
      await showAlert({
        title: "Action interdite",
        message: "Vous ne pouvez pas désactiver votre propre compte",
        variant: "warning",
      })
      return
    }

    const success = toggleUserActive(userId)
    if (success) {
      await showAlert({
        title: "Succès",
        message: `Utilisateur ${isActive ? "désactivé" : "réactivé"} avec succès!`,
        variant: "success",
      })
    } else {
      await showAlert({
        title: "Erreur",
        message: "Impossible de désactiver le dernier administrateur actif",
        variant: "error",
      })
    }
  }

  const handleToggle2FA = async (userId: string, username: string, currentStatus: boolean) => {
    const action = currentStatus ? "désactiver" : "activer"
    const confirmed = await confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} l'authentification 2FA`,
      description: `Êtes-vous sûr de vouloir ${action} l'authentification à deux facteurs pour "${username}" ?`,
      variant: currentStatus ? "warning" : "default",
      icon: currentStatus ? "cancel" : "validate",
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: "Annuler",
    })

    if (confirmed) {
      const success = toggle2FA(userId)
      if (success) {
        await showAlert({
          title: "Succès",
          message: `Authentification à deux facteurs ${currentStatus ? "désactivée" : "activée"} avec succès!`,
          variant: "success",
        })
      }
    }
  }

  const startEdit = (user: any) => {
    setFormData({
      username: user.username,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email || "",
      role: user.role,
    })
    setEditingUser(user.id)
    setShowCreateForm(false)
  }

  const cancelEdit = () => {
    setFormData({ username: "", password: "", firstName: "", lastName: "", phone: "", email: "", role: "user" })
    setEditingUser(null)
    setShowCreateForm(false)
  }

  const togglePasswordVisibility = (userId: string) => {
    setShowPassword((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }))
  }

  const adminUsers = users.filter((user) => user.role === "admin")
  const regularUsers = users.filter((user) => user.role === "user")

  console.log("[v0] Admin users:", adminUsers.length, adminUsers)
  console.log("[v0] Regular users:", regularUsers.length, regularUsers)

  return (
    <div className="space-y-6">
      {/* Header with Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Utilisateurs</p>
                <p className="text-3xl font-bold text-blue-800">{users.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Administrateurs</p>
                <p className="text-3xl font-bold text-purple-800">{adminUsers.length}</p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Utilisateurs Actifs</p>
                <p className="text-3xl font-bold text-green-800">{users.filter((user) => user.isActive).length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Utilisateurs Inactifs</p>
                <p className="text-3xl font-bold text-red-800">{users.filter((user) => !user.isActive).length}</p>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">2FA Activé</p>
                <p className="text-3xl font-bold text-orange-800">
                  {users.filter((user) => user.twoFactorEnabled).length}
                </p>
              </div>
              <Smartphone className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create User Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestion des Utilisateurs</h2>
        <Button
          onClick={() => {
            setShowCreateForm(!showCreateForm)
            setEditingUser(null)
            setFormData({ username: "", password: "", firstName: "", lastName: "", phone: "", email: "", role: "user" })
          }}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nouvel Utilisateur
        </Button>
      </div>

      {/* Create/Edit User Form */}
      {(showCreateForm || editingUser) && (
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              {editingUser ? "Modifier l'Utilisateur" : "Créer un Nouvel Utilisateur"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Entrez le prénom"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Entrez le nom"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Téléphone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Entrez le numéro de téléphone"
                />
              </div>
              <div>
                <Label htmlFor="username">Nom d'utilisateur *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Entrez le nom d'utilisateur"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="password">Mot de passe *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Entrez le mot de passe"
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Entrez l'adresse email"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Rôle *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "admin" | "user") => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Utilisateur</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={editingUser ? () => handleUpdateUser(editingUser) : handleCreateUser}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                {editingUser ? "Modifier" : "Créer"}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Administrators Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800">
            <Shield className="w-5 h-5" />
            Administrateurs ({adminUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adminUsers.map((user) => (
              <div
                key={user.id}
                className={`flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200 ${
                  !user.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">@{user.username}</p>
                    <p className="text-sm text-gray-600">{user.phone}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">{showPassword[user.id] ? user.password : "••••••••"}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="h-6 w-6 p-0"
                        title={showPassword[user.id] ? "Masquer mot de passe" : "Afficher mot de passe"}
                      >
                        {showPassword[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Créé le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Administrateur
                  </Badge>
                  <Badge
                    variant={user.isActive ? "default" : "destructive"}
                    className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {user.isActive ? "Actif" : "Inactif"}
                  </Badge>
                  <Badge
                    variant={user.twoFactorEnabled ? "default" : "secondary"}
                    className={user.twoFactorEnabled ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-600"}
                  >
                    {user.twoFactorEnabled ? "2FA ON" : "2FA OFF"}
                  </Badge>
                  {user.username === currentUsername && (
                    <Badge variant="outline" className="border-blue-300 text-blue-600">
                      Vous
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggle2FA(user.id, user.username, user.twoFactorEnabled)}
                    className={
                      user.twoFactorEnabled
                        ? "text-orange-600 border-orange-300 hover:bg-orange-50"
                        : "text-gray-600 border-gray-300 hover:bg-gray-50"
                    }
                    title={user.twoFactorEnabled ? "Désactiver 2FA" : "Activer 2FA"}
                  >
                    <Smartphone className="w-4 h-4 mr-1" />
                    {user.twoFactorEnabled ? "Désactiver 2FA" : "Activer 2FA"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(user.id, user.username, user.isActive)}
                    className={
                      user.isActive
                        ? "text-red-600 border-red-300 hover:bg-red-50"
                        : "text-green-600 border-green-300 hover:bg-green-50"
                    }
                    disabled={user.username === currentUsername && user.isActive}
                    title={user.isActive ? "Désactiver utilisateur" : "Activer utilisateur"}
                  >
                    {user.isActive ? <UserX className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                    {user.isActive ? "Désactiver" : "Activer"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startEdit(user)}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    title="Modifier utilisateur"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    disabled={user.username === currentUsername}
                    title="Supprimer utilisateur"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regular Users Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <User className="w-5 h-5" />
            Utilisateurs ({regularUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {regularUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Aucun utilisateur simple créé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {regularUsers.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 ${
                    !user.isActive ? "opacity-60" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">@{user.username}</p>
                      <p className="text-sm text-gray-600">{user.phone}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-600">{showPassword[user.id] ? user.password : "••••••••"}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => togglePasswordVisibility(user.id)}
                          className="h-6 w-6 p-0"
                          title={showPassword[user.id] ? "Masquer mot de passe" : "Afficher mot de passe"}
                        >
                          {showPassword[user.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Créé le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Utilisateur
                    </Badge>
                    <Badge
                      variant={user.isActive ? "default" : "destructive"}
                      className={user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                    >
                      {user.isActive ? "Actif" : "Inactif"}
                    </Badge>
                    <Badge
                      variant={user.twoFactorEnabled ? "default" : "secondary"}
                      className={user.twoFactorEnabled ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-600"}
                    >
                      {user.twoFactorEnabled ? "2FA ON" : "2FA OFF"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle2FA(user.id, user.username, user.twoFactorEnabled)}
                      className={
                        user.twoFactorEnabled
                          ? "text-orange-600 border-orange-300 hover:bg-orange-50"
                          : "text-gray-600 border-gray-300 hover:bg-gray-50"
                      }
                      title={user.twoFactorEnabled ? "Désactiver 2FA" : "Activer 2FA"}
                    >
                      <Smartphone className="w-4 h-4 mr-1" />
                      {user.twoFactorEnabled ? "Désactiver 2FA" : "Activer 2FA"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(user.id, user.username, user.isActive)}
                      className={
                        user.isActive
                          ? "text-red-600 border-red-300 hover:bg-red-50"
                          : "text-green-600 border-green-300 hover:bg-green-50"
                      }
                      title={user.isActive ? "Désactiver utilisateur" : "Activer utilisateur"}
                    >
                      {user.isActive ? <UserX className="w-4 h-4 mr-1" /> : <UserCheck className="w-4 h-4 mr-1" />}
                      {user.isActive ? "Désactiver" : "Activer"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(user)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      title="Modifier utilisateur"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      disabled={user.username === currentUsername}
                      title="Supprimer utilisateur"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
