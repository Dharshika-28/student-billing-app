"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Print from "expo-print"
import * as Sharing from "expo-sharing"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase/firebaseConfig"
import { useAuth } from "../../contexts/AuthContext"

interface Bill {
  id: string
  description: string
  amount: number
  dueDate: string
  status: string
  createdAt: string
  paidAt?: string
  studentName: string
}

interface Institution {
  institutionName: string
  email: string
}

export default function InvoiceViewer({ navigation, route }: any) {
  const { userData } = useAuth()
  const [bill] = useState<Bill>(route.params?.bill)
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInstitutionData()
  }, [])

  const loadInstitutionData = async () => {
    try {
      // Get institution data from the bill's institutionId
      const institutionDoc = await getDoc(doc(db, "users", userData?.institutionId || ""))
      if (institutionDoc.exists()) {
        setInstitution(institutionDoc.data() as Institution)
      }
    } catch (error) {
      console.error("Error loading institution data:", error)
    }
  }

  const generateInvoiceHTML = () => {
    const invoiceNumber = `INV-${bill.id.slice(-8).toUpperCase()}`
    const issueDate = new Date(bill.createdAt).toLocaleDateString()
    const dueDate = new Date(bill.dueDate).toLocaleDateString()
    const paidDate = bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : null

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #333;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            .invoice-info {
              text-align: right;
            }
            .invoice-number {
              font-size: 20px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 5px;
            }
            .billing-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 40px;
            }
            .billing-section {
              flex: 1;
            }
            .billing-section h3 {
              color: #2563eb;
              margin-bottom: 10px;
              font-size: 16px;
            }
            .billing-section p {
              margin: 5px 0;
              line-height: 1.4;
            }
            .invoice-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 40px;
            }
            .invoice-table th,
            .invoice-table td {
              padding: 12px;
              text-align: left;
              border-bottom: 1px solid #e2e8f0;
            }
            .invoice-table th {
              background-color: #f8fafc;
              font-weight: 600;
              color: #1e293b;
            }
            .total-section {
              text-align: right;
              margin-bottom: 40px;
            }
            .total-row {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 10px;
            }
            .total-label {
              width: 150px;
              text-align: right;
              margin-right: 20px;
              font-weight: 600;
            }
            .total-amount {
              width: 100px;
              text-align: right;
              font-weight: 600;
            }
            .grand-total {
              font-size: 18px;
              color: #2563eb;
              border-top: 2px solid #2563eb;
              padding-top: 10px;
            }
            .payment-status {
              background-color: #10b981;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              display: inline-block;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 20px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">${institution?.institutionName || "Educational Institution"}</div>
              <p>${institution?.email || ""}</p>
            </div>
            <div class="invoice-info">
              <div class="invoice-number">${invoiceNumber}</div>
              <p>Issue Date: ${issueDate}</p>
              <p>Due Date: ${dueDate}</p>
              ${paidDate ? `<p>Paid Date: ${paidDate}</p>` : ""}
            </div>
          </div>

          <div class="billing-info">
            <div class="billing-section">
              <h3>Bill To:</h3>
              <p><strong>${bill.studentName}</strong></p>
              <p>${userData?.email}</p>
              ${userData?.parentName ? `<p>Parent: ${userData.parentName}</p>` : ""}
            </div>
            <div class="billing-section">
              <h3>Payment Status:</h3>
              <div class="payment-status">PAID</div>
            </div>
          </div>

          <table class="invoice-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Due Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${bill.description}</td>
                <td>${dueDate}</td>
                <td>$${bill.amount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-section">
            <div class="total-row">
              <div class="total-label">Subtotal:</div>
              <div class="total-amount">$${bill.amount.toFixed(2)}</div>
            </div>
            <div class="total-row grand-total">
              <div class="total-label">Total:</div>
              <div class="total-amount">$${bill.amount.toFixed(2)}</div>
            </div>
          </div>

          <div class="footer">
            <p>Thank you for your payment!</p>
            <p>This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </body>
      </html>
    `
  }

  const handleDownloadPDF = async () => {
    setLoading(true)
    try {
      const html = generateInvoiceHTML()
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      })

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: `Invoice ${bill.id.slice(-8).toUpperCase()}`,
        })
      } else {
        Alert.alert("Success", "Invoice generated successfully!")
      }
    } catch (error) {
      console.error("Error generating PDF:", error)
      Alert.alert("Error", "Failed to generate PDF")
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    setLoading(true)
    try {
      const html = generateInvoiceHTML()
      await Print.printAsync({
        html,
      })
    } catch (error) {
      console.error("Error printing:", error)
      Alert.alert("Error", "Failed to print invoice")
    } finally {
      setLoading(false)
    }
  }

  if (!bill) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invoice not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        <Text style={styles.title}>Invoice</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handlePrint} disabled={loading}>
            <Ionicons name="print" size={20} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDownloadPDF} disabled={loading}>
            <Ionicons name="download" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.invoiceContainer}>
          {/* Invoice Header */}
          <View style={styles.invoiceHeader}>
            <View>
              <Text style={styles.institutionName}>{institution?.institutionName || "Educational Institution"}</Text>
              <Text style={styles.institutionEmail}>{institution?.email}</Text>
            </View>
            <View style={styles.invoiceInfo}>
              <Text style={styles.invoiceNumber}>INV-{bill.id.slice(-8).toUpperCase()}</Text>
              <Text style={styles.invoiceDate}>Issue Date: {new Date(bill.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.invoiceDate}>Due Date: {new Date(bill.dueDate).toLocaleDateString()}</Text>
              {bill.paidAt && <Text style={styles.paidDate}>Paid: {new Date(bill.paidAt).toLocaleDateString()}</Text>}
            </View>
          </View>

          {/* Billing Information */}
          <View style={styles.billingSection}>
            <View style={styles.billTo}>
              <Text style={styles.sectionTitle}>Bill To:</Text>
              <Text style={styles.studentName}>{bill.studentName}</Text>
              <Text style={styles.studentEmail}>{userData?.email}</Text>
              {userData?.parentName && <Text style={styles.parentName}>Parent: {userData.parentName}</Text>}
            </View>
            <View style={styles.paymentStatus}>
              <Text style={styles.sectionTitle}>Status:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>PAID</Text>
              </View>
            </View>
          </View>

          {/* Invoice Details */}
          <View style={styles.invoiceDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailLabel}>Due Date</Text>
              <Text style={styles.detailLabel}>Amount</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailValue}>{bill.description}</Text>
              <Text style={styles.detailValue}>{new Date(bill.dueDate).toLocaleDateString()}</Text>
              <Text style={styles.detailValue}>${bill.amount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Total Section */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalAmount}>${bill.amount.toFixed(2)}</Text>
            </View>
            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${bill.amount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your payment!</Text>
            <Text style={styles.footerSubtext}>This is a computer-generated invoice.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.actionBarButton, styles.printButton]} onPress={handlePrint} disabled={loading}>
          <Ionicons name="print" size={20} color="white" />
          <Text style={styles.actionBarButtonText}>Print</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBarButton, styles.downloadButton]}
          onPress={handleDownloadPDF}
          disabled={loading}
        >
          <Ionicons name="download" size={20} color="white" />
          <Text style={styles.actionBarButtonText}>{loading ? "Generating..." : "Download PDF"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingBottom: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  invoiceContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  invoiceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#2563eb",
  },
  institutionName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  institutionEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  invoiceInfo: {
    alignItems: "flex-end",
  },
  invoiceNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  paidDate: {
    fontSize: 14,
    color: "#10b981",
    fontWeight: "500",
  },
  billingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  billTo: {
    flex: 1,
  },
  paymentStatus: {
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  studentEmail: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  parentName: {
    fontSize: 14,
    color: "#64748b",
  },
  statusBadge: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  invoiceDetails: {
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#64748b",
    flex: 1,
    textAlign: "right",
  },
  totalSection: {
    alignItems: "flex-end",
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
    minWidth: 200,
  },
  grandTotal: {
    borderTopWidth: 2,
    borderTopColor: "#2563eb",
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginRight: 20,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2563eb",
    minWidth: 80,
    textAlign: "right",
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  footerText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: "#64748b",
  },
  actionBar: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  actionBarButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  printButton: {
    backgroundColor: "#64748b",
  },
  downloadButton: {
    backgroundColor: "#2563eb",
  },
  actionBarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#64748b",
  },
})
