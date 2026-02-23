import React, {useLayoutEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native';
import {RouteProp} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import {RootStackParamList} from '../../navigation/types';
import {COLORS, SPACING} from '../../config/constants';
import {useUploads, useUploadFile, useDeleteUpload, useSummarize} from '../../hooks/useUploads';
import {UploadResponse} from '../../services/api/uploads';

type Props = {
  navigation: StackNavigationProp<RootStackParamList, 'UploadList'>;
  route: RouteProp<RootStackParamList, 'UploadList'>;
};

const ORANGE = '#FF9500';

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function fileIcon(fileType: string, filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') {return '📄';}
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') {return '🖼️';}
  if (fileType === 'prescription') {return '💊';}
  return '📋';
}

function typeBadgeColor(fileType: string): string {
  return fileType === 'prescription' ? '#5856D6' : '#34C759';
}

// ── Upload card ────────────────────────────────────────────────────────────────
function UploadCard({
  upload,
  onDelete,
  onSummarize,
  isSelected,
  onSelect,
}: {
  upload: UploadResponse;
  onDelete: () => void;
  onSummarize: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const badgeColor = typeBadgeColor(upload.file_type);
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.85}>
      <View style={styles.cardRow}>
        <Text style={styles.cardIcon}>{fileIcon(upload.file_type, upload.filename)}</Text>
        <View style={styles.cardBody}>
          <Text style={styles.cardFilename} numberOfLines={2}>
            {upload.filename}
          </Text>
          <View style={styles.cardMeta}>
            <View style={[styles.typeBadge, {backgroundColor: badgeColor + '18', borderColor: badgeColor}]}>
              <Text style={[styles.typeBadgeText, {color: badgeColor}]}>
                {upload.file_type === 'prescription' ? 'Prescription' : 'Report'}
              </Text>
            </View>
            <Text style={styles.cardDate}>{formatDate(upload.uploaded_at)}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onSummarize}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.actionBtnText}>✨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={onDelete}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <Text style={styles.actionBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
      {isSelected && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.selectedIndicatorText}>Selected for summarization</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ── Upload source picker modal ─────────────────────────────────────────────────
function SourceModal({
  visible,
  onClose,
  onCamera,
  onLibrary,
  onDocument,
}: {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onLibrary: () => void;
  onDocument: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Add Document</Text>

          <TouchableOpacity style={styles.sheetOption} onPress={onCamera}>
            <Text style={styles.sheetOptionIcon}>📷</Text>
            <View>
              <Text style={styles.sheetOptionLabel}>Camera</Text>
              <Text style={styles.sheetOptionSub}>Capture a document or photo</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetOption} onPress={onLibrary}>
            <Text style={styles.sheetOptionIcon}>🖼️</Text>
            <View>
              <Text style={styles.sheetOptionLabel}>Photo Library</Text>
              <Text style={styles.sheetOptionSub}>Choose an existing image</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetOption} onPress={onDocument}>
            <Text style={styles.sheetOptionIcon}>📁</Text>
            <View>
              <Text style={styles.sheetOptionLabel}>Files</Text>
              <Text style={styles.sheetOptionSub}>Browse PDF, PNG, JPG documents</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── File type picker modal ─────────────────────────────────────────────────────
function FileTypeModal({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: 'prescription' | 'report') => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Document Type</Text>
          <Text style={styles.sheetSubtitle}>What type of document is this?</Text>

          <TouchableOpacity style={styles.sheetOption} onPress={() => onSelect('prescription')}>
            <Text style={styles.sheetOptionIcon}>💊</Text>
            <View>
              <Text style={styles.sheetOptionLabel}>Prescription</Text>
              <Text style={styles.sheetOptionSub}>Medication prescription from a doctor</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetOption} onPress={() => onSelect('report')}>
            <Text style={styles.sheetOptionIcon}>📋</Text>
            <View>
              <Text style={styles.sheetOptionLabel}>Medical Report</Text>
              <Text style={styles.sheetOptionSub}>Lab results, diagnosis, or test report</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.sheetCancel} onPress={onClose}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
export default function UploadListScreen({navigation, route}: Props) {
  const {patientId, patientName} = route.params;

  const {data: uploads, isLoading, isError, refetch, isFetching} = useUploads(patientId);
  const {mutate: uploadFile, isPending: isUploading} = useUploadFile();
  const {mutate: deleteUpload} = useDeleteUpload();
  const {mutate: summarize, isPending: isSummarizing, reset: resetSummary} = useSummarize();

  const [showSource, setShowSource] = useState(false);
  const [showFileType, setShowFileType] = useState(false);
  const [pendingFile, setPendingFile] = useState<{uri: string; name: string; type: string} | null>(
    null,
  );
  const [selectedUploadId, setSelectedUploadId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({title: patientName});
  }, [navigation, patientName]);

  // ── Pick handlers ────────────────────────────────────────────────────────────

  const handleCamera = () => {
    setShowSource(false);
    launchCamera(
      {mediaType: 'photo', quality: 0.85, includeBase64: false},
      response => {
        if (response.didCancel || response.errorCode) {return;}
        const asset = response.assets?.[0];
        if (!asset?.uri) {return;}
        const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
        const type = asset.type ?? 'image/jpeg';
        setPendingFile({uri: asset.uri, name, type});
        setShowFileType(true);
      },
    );
  };

  const handleLibrary = () => {
    setShowSource(false);
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.85, includeBase64: false},
      response => {
        if (response.didCancel || response.errorCode) {return;}
        const asset = response.assets?.[0];
        if (!asset?.uri) {return;}
        const name = asset.fileName ?? `image_${Date.now()}.jpg`;
        const type = asset.type ?? 'image/jpeg';
        setPendingFile({uri: asset.uri, name, type});
        setShowFileType(true);
      },
    );
  };

  const handleDocument = async () => {
    setShowSource(false);
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.images,
        ],
        copyTo: 'cachesDirectory',
      });
      const doc = result[0];
      if (!doc) {return;}
      const uri = doc.fileCopyUri ?? doc.uri;
      setPendingFile({uri, name: doc.name ?? 'document', type: doc.type ?? 'application/pdf'});
      setShowFileType(true);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick document.');
      }
    }
  };

  const handleFileTypeSelect = (fileType: 'prescription' | 'report') => {
    setShowFileType(false);
    if (!pendingFile) {return;}
    uploadFile(
      {patientId, fileType, file: pendingFile},
      {
        onSuccess: () => setPendingFile(null),
        onError: () => Alert.alert('Error', 'Failed to upload document. Please try again.'),
      },
    );
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = (upload: UploadResponse) => {
    Alert.alert(
      'Delete Document',
      `Delete "${upload.filename}"? This cannot be undone.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            if (selectedUploadId === upload.id) {
              setSelectedUploadId(null);
              setSummary(null);
            }
            deleteUpload(upload.id, {
              onError: () => Alert.alert('Error', 'Failed to delete document.'),
            });
          },
        },
      ],
    );
  };

  // ── Summarize ────────────────────────────────────────────────────────────────
  const handleSummarize = (uploadId: string) => {
    setSelectedUploadId(uploadId);
    setSummary(null);
    resetSummary();
    summarize(uploadId, {
      onSuccess: text => setSummary(text),
      onError: () => Alert.alert('Error', 'Failed to summarize document. Ensure backend is running.'),
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={ORANGE} />
          <Text style={styles.loadingText}>Loading documents…</Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.bigIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load documents</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            tintColor={ORANGE}
          />
        }>

        {/* Upload list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents ({uploads?.length ?? 0})</Text>

          {!uploads || uploads.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.bigIcon}>📂</Text>
              <Text style={styles.emptyTitle}>No documents yet</Text>
              <Text style={styles.emptySub}>
                Tap the + button to upload prescriptions or medical reports.
              </Text>
            </View>
          ) : (
            uploads.map(upload => (
              <UploadCard
                key={upload.id}
                upload={upload}
                isSelected={selectedUploadId === upload.id}
                onSelect={() => {
                  if (selectedUploadId === upload.id) {
                    setSelectedUploadId(null);
                    setSummary(null);
                  } else {
                    setSelectedUploadId(upload.id);
                    setSummary(null);
                  }
                }}
                onDelete={() => handleDelete(upload)}
                onSummarize={() => handleSummarize(upload.id)}
              />
            ))
          )}
        </View>

        {/* AI Summarization section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>AI Summarization</Text>
            <Text style={styles.aiPowered}>✨ Powered by Claude</Text>
          </View>

          {!selectedUploadId ? (
            <View style={styles.summaryPlaceholder}>
              <Text style={styles.summaryPlaceholderIcon}>🤖</Text>
              <Text style={styles.summaryPlaceholderText}>
                Select a document above or tap ✨ on any document to generate an AI summary of its contents.
              </Text>
            </View>
          ) : isSummarizing ? (
            <View style={styles.summaryLoading}>
              <ActivityIndicator size="small" color={ORANGE} />
              <Text style={styles.summaryLoadingText}>Analyzing document with Claude…</Text>
            </View>
          ) : summary ? (
            <View style={styles.summaryResult}>
              <View style={styles.summaryResultHeader}>
                <Text style={styles.summaryResultTitle}>Summary</Text>
                <TouchableOpacity
                  onPress={() => {
                    setSelectedUploadId(null);
                    setSummary(null);
                  }}>
                  <Text style={styles.summaryClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.summaryText}>{summary}</Text>
              <TouchableOpacity
                style={styles.resummBtn}
                onPress={() => selectedUploadId && handleSummarize(selectedUploadId)}>
                <Text style={styles.resummBtnText}>Re-summarize</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.summaryPlaceholder}>
              <Text style={styles.summaryPlaceholderIcon}>📄</Text>
              <Text style={styles.summaryPlaceholderText}>
                Document selected. Tap ✨ on the document card to generate the summary.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.flex}>
      {renderContent()}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, isUploading && styles.fabDisabled]}
        onPress={() => setShowSource(true)}
        disabled={isUploading}
        activeOpacity={0.85}>
        {isUploading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.fabText}>+</Text>
        )}
      </TouchableOpacity>

      <SourceModal
        visible={showSource}
        onClose={() => setShowSource(false)}
        onCamera={handleCamera}
        onLibrary={handleLibrary}
        onDocument={handleDocument}
      />

      <FileTypeModal
        visible={showFileType}
        onClose={() => {
          setShowFileType(false);
          setPendingFile(null);
        }}
        onSelect={handleFileTypeSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1, backgroundColor: COLORS.background},

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  bigIcon: {fontSize: 48, marginBottom: SPACING.md},
  loadingText: {marginTop: SPACING.sm, color: COLORS.textSecondary, fontSize: 14},
  errorTitle: {fontSize: 16, fontWeight: '600', color: COLORS.error, marginBottom: SPACING.md},
  retryBtn: {
    backgroundColor: ORANGE,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  retryBtnText: {color: COLORS.white, fontWeight: '600'},

  scroll: {flex: 1},
  scrollContent: {padding: SPACING.lg, paddingBottom: 100},

  section: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: SPACING.md,
  },
  aiPowered: {
    fontSize: 11,
    color: ORANGE,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },

  // Upload card
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  cardSelected: {
    borderColor: ORANGE,
    backgroundColor: ORANGE + '08',
  },
  cardRow: {flexDirection: 'row', alignItems: 'center'},
  cardIcon: {fontSize: 28, marginRight: SPACING.sm},
  cardBody: {flex: 1},
  cardFilename: {fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6},
  cardMeta: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeBadgeText: {fontSize: 11, fontWeight: '600'},
  cardDate: {fontSize: 11, color: COLORS.textSecondary},
  cardActions: {flexDirection: 'row', gap: SPACING.xs, marginLeft: SPACING.sm},
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {borderColor: COLORS.error + '40'},
  actionBtnText: {fontSize: 16},
  selectedIndicator: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: ORANGE + '30',
  },
  selectedIndicatorText: {fontSize: 12, color: ORANGE, fontWeight: '600'},

  // Empty state
  emptyWrap: {alignItems: 'center', paddingVertical: SPACING.xl},
  emptyTitle: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 6},
  emptySub: {fontSize: 13, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20},

  // Summarization
  summaryPlaceholder: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  summaryPlaceholderIcon: {fontSize: 36, marginBottom: SPACING.sm},
  summaryPlaceholderText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  summaryLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    justifyContent: 'center',
  },
  summaryLoadingText: {fontSize: 14, color: COLORS.textSecondary},
  summaryResult: {gap: SPACING.sm},
  summaryResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryResultTitle: {fontSize: 14, fontWeight: '700', color: COLORS.text},
  summaryClose: {fontSize: 16, color: COLORS.textSecondary, padding: 4},
  summaryText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: SPACING.md,
  },
  resummBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ORANGE,
  },
  resummBtnText: {fontSize: 12, color: ORANGE, fontWeight: '600'},

  // Bottom sheet / modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : SPACING.lg,
    paddingTop: SPACING.md,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  sheetOptionIcon: {fontSize: 28, width: 40, textAlign: 'center'},
  sheetOptionLabel: {fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 2},
  sheetOptionSub: {fontSize: 12, color: COLORS.textSecondary},
  sheetCancel: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.sm,
  },
  sheetCancelText: {fontSize: 16, color: COLORS.error, fontWeight: '600'},

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.lg + (Platform.OS === 'ios' ? 20 : 0),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ORANGE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  fabDisabled: {opacity: 0.6},
  fabText: {fontSize: 28, color: COLORS.white, lineHeight: 32},
});
