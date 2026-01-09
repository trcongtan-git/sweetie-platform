"use client";

import React, {
  useState,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
  useCallback,
} from "react";
import styles from "./FolderTree.module.css";
import {
  Tree,
  Button,
  Modal,
  Input,
  Form,
  Radio,
  Empty,
  Spin,
  type InputRef,
} from "antd";
import type { DataNode } from "antd/es/tree";
import {
  FolderOutlined,
  FolderOpenOutlined,
  FileOutlined,
  FolderAddOutlined,
  EditOutlined,
  DeleteOutlined,
  ExpandAltOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import FileUpload from "./FileUpload";
import { useToast } from "@/providers/toast";

export interface FolderNode {
  id: string;
  title: string;
  type: "folder" | "file";
  children?: FolderNode[];
  parentId?: string;
  createdAt?: string;
  updatedAt?: string;
         metadata?: {
           attachments?: File[];
           // PDF extraction fields
           extractedMarkdown?: string;
           pdfExtractionStatus?: "pending" | "completed" | "failed";
           pdfExtractionError?: string;
           pdfExtractionDate?: string;
           pdfFileStatus?: "new" | "latest" | "outdated";
           [key: string]: unknown;
         };
}

export interface FolderTreeRef {
  expandAll: () => void;
  collapseAll: () => void;
  selectNode: (id: string) => void;
}

export interface FolderTreeProps {
  data: FolderNode[];
  loading?: boolean;
  onNodeSelect?: (selectedKeys: string[], info: { node: DataNode; selected: boolean }) => void;
  onNodeExpand?: (expandedKeys: string[], info: { node: DataNode; expanded: boolean }) => void;
  onNodeRightClick?: (info: { node: DataNode; event: React.MouseEvent }) => void;
  onAddFolder?: (parentId: string | null, name: string) => Promise<void>;
  onCreateFolderClick?: (parentId: string | null) => void;
  onCreateChecklistClick?: (parentId: string | null) => void;
  onEditFolder?: (id: string) => void;
  onDeleteFolder?: (id: string) => Promise<void>;
  onAddFile?: (
    parentId: string,
    data: {
      name: string;
      attachments?: File[];
      environment?: "web" | "app" | "desktop";
      prompt?: string;
    }
  ) => Promise<void>;
  onEditFile?: (id: string) => void;
  onDeleteFile?: (id: string) => Promise<void>;
  editable?: boolean;
  selectable?: boolean;
  showActions?: boolean;
  showRootAddButton?: boolean;
  // Show built-in header controls (expand/collapse/search) above the tree
  showHeaderControls?: boolean;
  draggable?: boolean;
  onMoveNode?: (
    dragNodeId: string,
    newParentId: string | null,
    dropPosition: number
  ) => Promise<void>;
  className?: string;
  style?: React.CSSProperties;
  height?: number;
  // Expose expand/collapse functions
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  // External expanded keys control
  expandedKeys?: string[];
  // External selected keys control
  selectedKeys?: string[];
}

const FolderTree = forwardRef<FolderTreeRef, FolderTreeProps>(
  (
    {
      data,
      loading = false,
      onNodeSelect,
      onNodeExpand,
      onNodeRightClick,
      onAddFolder,
      onCreateFolderClick,
      onCreateChecklistClick,
      onEditFolder,
      onDeleteFolder,
      onAddFile,
      onEditFile,
      onDeleteFile,
      editable = true,
      selectable: _selectable = true,
      showActions: _showActions = true,
      showRootAddButton = true,
      showHeaderControls = true,
      draggable = false,
      onMoveNode,
      className,
      style,
      height = "100%",
      expandedKeys: externalExpandedKeys,
      selectedKeys: externalSelectedKeys,
    },
    ref
  ) => {
    const { toastError } = useToast();
    const [treeData, setTreeData] = useState<DataNode[]>([]);
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const containerRef = useRef<HTMLDivElement | null>(null);

    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchValue, setSearchValue] = useState("");

    // Debug internal state changes (commented out for production)
    // useEffect(() => {
    //   console.log("FolderTree: internal expandedKeys changed:", expandedKeys);
    // }, [expandedKeys]);

    // useEffect(() => {
    //   console.log("FolderTree: internal selectedKeys changed:", selectedKeys);
    // }, [selectedKeys]);
    const searchInputRef = useRef<InputRef>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<
      "add-folder" | "add-file" | "edit"
    >("add-folder");
    const [modalTitle, setModalTitle] = useState("");
    const [formData, setFormData] = useState<{
      name: string;
      attachments: File[];
      environment?: "web" | "app" | "desktop";
    }>({
      name: "",
      attachments: [] as File[],
      environment: "web",
    });
    const [currentNode, setCurrentNode] = useState<FolderNode | null>(null);
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({
      x: 0,
      y: 0,
    });
    const [contextMenuNode, setContextMenuNode] = useState<FolderNode | null>(
      null
    );
    const [deleteModalVisible, setDeleteModalVisible] = useState(false);
    const [nodeToDelete, setNodeToDelete] = useState<FolderNode | null>(null);

    // Use Ant Tree default motion (removes custom overrides that disabled per-node transitions)
    const treeMotion: undefined = undefined;

    // Allow raw name input; backend will validate/sanitize

    // Sort nodes: folders first, then files, both alphabetically
    const sortNodes = (nodes: FolderNode[]): FolderNode[] => {
      return [...nodes].sort((a, b) => {
        // First sort by type (folders before files)
        if (a.type !== b.type) {
          return a.type === "folder" ? -1 : 1;
        }
        // Then sort alphabetically by title
        return a.title.localeCompare(b.title, "vi", { numeric: true });
      });
    };

    // Highlight search text in title
    const highlightText = (text: string, searchTerm: string): React.ReactNode => {
      if (!searchTerm.trim()) {
        return text;
      }
      
      const normalizedSearchTerm = normalizeText(searchTerm.trim());
      const normalizedText = normalizeText(text);
      const index = normalizedText.indexOf(normalizedSearchTerm);
      
      if (index === -1) {
        return text;
      }
      
      // Find the actual text position to highlight by using normalized comparison
      // We need to find the original text segments that match the normalized search term
      let currentIndex = 0;
      const result = [];
      
      while (currentIndex < text.length) {
        const remainingText = text.substring(currentIndex);
        const normalizedRemaining = normalizeText(remainingText);
        const matchIndex = normalizedRemaining.indexOf(normalizedSearchTerm);
        
        if (matchIndex === -1) {
          // No more matches, add the rest of the text
          result.push(remainingText);
          break;
        }
        
        // Add text before the match
        if (matchIndex > 0) {
          result.push(remainingText.substring(0, matchIndex));
        }
        
        // Find the actual match in original text
        // We need to map the normalized position back to original position
        let originalMatchLength = 0;
        let normalizedLength = 0;
        
        for (let i = 0; i < remainingText.length && normalizedLength < normalizedSearchTerm.length; i++) {
          const char = remainingText[i];
          const normalizedChar = normalizeText(char);
          originalMatchLength++;
          normalizedLength += normalizedChar.length;
        }
        
        const matchText = remainingText.substring(matchIndex, matchIndex + originalMatchLength);
        result.push({
          text: matchText,
          isMatch: true
        });
        
        currentIndex += matchIndex + originalMatchLength;
      }
      
      return (
        <span>
          {result.map((item, i) => {
            if (typeof item === 'string') {
              return item;
            } else {
              return (
                <span 
                  key={i}
                  style={{ 
                    color: '#ff4d4f', 
                    fontWeight: 'normal'
                  }}
                >
                  {item.text}
                </span>
              );
            }
          })}
        </span>
      );
    };

    // Convert folder data to tree data
    const convertToTreeData = (nodes: FolderNode[]): DataNode[] => {
      const sortedNodes = sortNodes(nodes);
      return sortedNodes.map((node) => ({
        key: node.id,
        title: highlightText(node.title, searchValue),
        icon: node.type === "folder" ? <FolderOutlined /> : <FileOutlined />,
        children: node.children ? convertToTreeData(node.children) : undefined,
        isLeaf: node.type === "file",
        data: node,
        // Keep original title for search logic
        originalTitle: node.title,
      }));
    };

    // Collect all folder keys (non-file keys)
    const getAllFolderKeys = (nodes: DataNode[]): string[] => {
      const keys: string[] = [];
      const traverse = (nodeList: DataNode[]) => {
        nodeList.forEach((node) => {
          if (!node.isLeaf) {
            // Only folders, not files
            keys.push(node.key as string);
          }
          if (node.children) {
            traverse(node.children);
          }
        });
      };
      traverse(nodes);
      return keys;
    };

    // Update tree data when props or search value change
    useEffect(() => {
      // console.log("FolderTree received data:", data);
      const convertedData = convertToTreeData(data);
      // console.log("Converted tree data:", convertedData);
      setTreeData(convertedData);
    }, [data, searchValue]);

    // Update expanded keys when external expanded keys change
    useEffect(() => {
      // Debug logging (commented out for production)
      // console.log("FolderTree: externalExpandedKeys changed:", externalExpandedKeys);
      if (externalExpandedKeys) {
        // console.log("FolderTree: Setting expandedKeys to:", externalExpandedKeys);
        setExpandedKeys(externalExpandedKeys);
      }
    }, [externalExpandedKeys]);

    // Update selected keys when external selected keys change
    useEffect(() => {
      // Debug logging (commented out for production)
      // console.log("FolderTree: externalSelectedKeys changed:", externalSelectedKeys);
      if (externalSelectedKeys) {
        // console.log("FolderTree: Setting selectedKeys to:", externalSelectedKeys);
        setSelectedKeys(externalSelectedKeys);
      }
    }, [externalSelectedKeys]);

    // Normalize for accent-insensitive search
    const normalizeText = useCallback((text: string): string => {
      return (text || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "d");
    }, []);

    // Autofocus when opening search
    useEffect(() => {
      if (isSearchOpen) {
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      }
    }, [isSearchOpen]);

    // Expand according to search
    useEffect(() => {
      const q = normalizeText(searchValue.trim());
      if (!q) {
        // Don't collapse all when cleared if we have external expanded keys
        // This prevents external expanded keys from being overridden by search logic
        if (!externalExpandedKeys || externalExpandedKeys.length === 0) {
          setExpandedKeys([]);
        }
        return;
      }
      const expandSet = new Set<string>();
      const visit = (node: DataNode): boolean => {
        // Use originalTitle if available, otherwise fall back to title
        const nodeWithOriginal = node as DataNode & { originalTitle?: string };
        const title = String(nodeWithOriginal.originalTitle ?? node.title ?? "");
        const selfMatch = normalizeText(title).includes(q);
        let childMatch = false;
        if (node.children && node.children.length > 0) {
          for (const child of node.children) {
            childMatch = visit(child) || childMatch;
          }
        }
        const matched = selfMatch || childMatch;
        if (matched && !node.isLeaf) {
          expandSet.add(node.key as string);
        }
        return matched;
      };
      treeData.forEach(visit);
      setExpandedKeys(Array.from(expandSet));
    }, [searchValue, treeData, normalizeText, externalExpandedKeys]);

    // Expand all folders without animation
    const handleExpandAll = () => {
      const allFolderKeys = getAllFolderKeys(treeData);
      setExpandedKeys(allFolderKeys);
      if (onNodeExpand) {
        onNodeExpand(allFolderKeys, { expanded: true, node: null });
      }
    };

    // Collapse all folders without animation
    const handleCollapseAll = () => {
      setExpandedKeys([]);
      if (onNodeExpand) {
        onNodeExpand([], { expanded: false, node: null });
      }
    };

    // Expose expand/collapse functions to parent component
    useImperativeHandle(
      ref,
      () => ({
        expandAll: handleExpandAll,
        collapseAll: handleCollapseAll,
        selectNode: (id: string) => {
          setSelectedKeys([id]);

          // Try to notify parent similar to onSelect
          if (onNodeSelect) {
            // Find the node in treeData
            const findNode = (nodes: DataNode[]): DataNode | null => {
              for (const n of nodes) {
                if (n.key === id) return n;
                if (n.children) {
                  const found = findNode(n.children);
                  if (found) return found;
                }
              }
              return null;
            };
            const node = findNode(treeData);
            if (node) {
              onNodeSelect([id], { node, selected: true });
            }
          }
        },
      }),
      [treeData]
    );

    // Handle node select
    const handleSelect = (selectedKeys: React.Key[], info: { node: DataNode; selected: boolean }) => {
      setSelectedKeys(selectedKeys as string[]);
      if (onNodeSelect) {
        onNodeSelect(selectedKeys as string[], { node: info.node, selected: info.selected });
      }
    };

    // Handle node expand
    const handleExpand = (expandedKeys: React.Key[], info: { node: DataNode; expanded: boolean }) => {
      setExpandedKeys(expandedKeys as string[]);
      if (onNodeExpand) {
        onNodeExpand(expandedKeys as string[], { node: info.node, expanded: info.expanded });
      }
    };

    // Handle right click
    const handleRightClick = (info: { node: DataNode; event: React.MouseEvent }) => {
      if (onNodeRightClick) {
        onNodeRightClick(info);
      }

      // Show context menu
      if (editable && info.node) {
        const node = info.node.data as FolderNode;
        setContextMenuNode(node);
        setContextMenuPosition({
          x: info.event.clientX,
          y: info.event.clientY,
        });
        setContextMenuVisible(true);
      }
    };

    // Hide context menu when clicking outside
    useEffect(() => {
      const handleClickOutside = () => {
        setContextMenuVisible(false);
      };

      if (contextMenuVisible) {
        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
      }
    }, [contextMenuVisible]);

    // Keep selection persistent - don't clear when clicking blank areas
    const handleContainerClick = () => {
      // Disabled auto-clear selection to maintain focus on selected item
      // This ensures checklist/folder selection is never lost when clicking empty areas
      return;
    };

    // Reserved for future use - calculate level of a node based on parentId
    // const getNodeLevel = (nodeId: string, allNodes: FolderNode[]): number => {
    //   const findNode = (nodes: FolderNode[], targetId: string): FolderNode | null => {
    //     for (const node of nodes) {
    //       if (node.id === targetId) return node;
    //       if (node.children) {
    //         const found = findNode(node.children, targetId);
    //         if (found) return found;
    //       }
    //     }
    //     return null;
    //   };
    //
    //   const node = findNode(allNodes, nodeId);
    //   if (!node) return 0;
    //   
    //   if (!node.parentId) return 0; // Root level
    //   
    //   return getNodeLevel(node.parentId, allNodes) + 1;
    // };

    // Handle drag and drop
    const handleDrop = async (info: {
      dragNode: DataNode;
      node: DataNode;
      dropToGap: boolean;
      dropPosition: number;
    }) => {
      try {
        if (!onMoveNode) return;
        const dragNodeData = info.dragNode?.data as FolderNode | undefined;
        const dropNodeData = info.node?.data as FolderNode | undefined;
        if (!dragNodeData || !dropNodeData) return;

        // Prevent dropping inside a file when not dropping to gap
        if (!info.dropToGap && dropNodeData.type === "file") {
          toastError("Không thể di chuyển vào checklist");
          return;
        }

        // Determine new parent target
        // If dropToGap: moving as sibling of drop node → parent is drop node's parent
        // Else: moving inside drop node → parent is drop node
        const newParentId = info.dropToGap
          ? dropNodeData.parentId || null
          : dropNodeData.id;

        // Only allow drag and drop to different levels (not same level siblings)
        if (info.dropToGap && dragNodeData.parentId === dropNodeData.parentId) {
          toastError("Không thể di chuyển cùng cấp. Vui lòng di chuyển lên cấp khác hoặc vào trong thư mục");
          return;
        }

        const rawPos = Number(info.dropPosition ?? 0);
        const position = isNaN(rawPos) || rawPos < 0 ? 0 : rawPos;

        await onMoveNode(dragNodeData.id, newParentId ?? null, position);
      } catch {
        toastError("Không thể di chuyển");
      }
    };

    // Show modal for add/edit
    const showModal = (
      type: "add-folder" | "add-file" | "edit",
      node?: FolderNode,
      _parentId?: string
    ) => {
      setModalType(type);
      setCurrentNode(node || null);

      switch (type) {
        case "add-folder":
          setModalTitle("Tạo thư mục mới");
          setFormData({
            name: "",
            attachments: [],
          });
          break;
        case "add-file":
          setModalTitle("Tạo checklist mới");
          setFormData({
            name: "",
            attachments: [],
            environment: "web",
          });
          break;
        case "edit":
          setModalTitle(
            node?.type === "folder" ? "Sửa tên thư mục" : "Sửa checklist"
          );
          setFormData({
            name: node?.title || "",
            attachments: node?.metadata?.attachments || [],
            environment: (node?.metadata?.environment as "web" | "app" | "desktop" | undefined) || "web",
          });
          break;
      }

      setModalVisible(true);
    };

    // Handle root folder creation
    const handleRootAddFolder = () => {
      if (onCreateFolderClick) {
        onCreateFolderClick(null); // Root level folder
      } else {
        showModal("add-folder");
      }
    };

    // Handle modal confirm
    const handleModalConfirm = async () => {
      if (!formData.name.trim()) {
        toastError("Vui lòng nhập tên");
        return;
      }

      try {
        switch (modalType) {
          case "add-folder":
            if (onAddFolder) {
              const parentId = currentNode ? currentNode.id : null;
              await onAddFolder(parentId, formData.name.trim());
            }
            break;
          case "add-file":
            if (onAddFile && currentNode) {
              await onAddFile(currentNode.id, {
                name: formData.name.trim(),
                attachments: formData.attachments,
                environment: formData.environment,
              });
              // Toast sẽ được hiển thị bởi parent component
            }
            break;
          case "edit":
            if (currentNode) {
              if (currentNode.type === "folder" && onEditFolder) {
                // Call parent's edit function directly (opens new popup)
                onEditFolder(currentNode.id);
              } else if (currentNode.type === "file" && onEditFile) {
                // Call parent's edit function directly (opens new popup)
                onEditFile(currentNode.id);
              }
            }
            break;
        }
        setModalVisible(false);
        setFormData({
          name: "",
          attachments: [],
        });
        setCurrentNode(null);
      } catch {
        toastError("Có lỗi xảy ra");
      }
    };

    // Handle delete
    const handleDelete = (node: FolderNode) => {
      setNodeToDelete(node);
      setDeleteModalVisible(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
      if (!nodeToDelete) return;

      try {
        if (nodeToDelete.type === "folder" && onDeleteFolder) {
          await onDeleteFolder(nodeToDelete.id);
          // Toast sẽ được hiển thị bởi parent component
        } else if (nodeToDelete.type === "file" && onDeleteFile) {
          await onDeleteFile(nodeToDelete.id);
          // Toast sẽ được hiển thị bởi parent component
        }
      } catch {
        toastError("Có lỗi xảy ra");
      } finally {
        setDeleteModalVisible(false);
        setNodeToDelete(null);
      }
    };

    // Handle delete cancel
    const handleDeleteCancel = () => {
      setDeleteModalVisible(false);
      setNodeToDelete(null);
    };

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          ...style,
          minWidth: 0,
          overflow: "hidden", // Prevent header from scrolling
          display: "flex",
          flexDirection: "column",
          height: height === "100%" ? "100%" : height || 400,
        }}
        onClick={handleContainerClick}
      >
        {/* Header Controls - Fixed */}
        {editable && showHeaderControls && (
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: 28,
              flexShrink: 0, // Prevent header from shrinking
              overflow: "hidden", // Prevent header from scrolling
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#101828",
                whiteSpace: "nowrap",
                lineHeight: "28px",
              }}
            >
              Thư mục
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                position: "relative",
                flex: 1,
                minWidth: 0,
                marginLeft: 12,
                justifyContent: "flex-end",
                height: 28,
              }}
            >
              {!isSearchOpen && (
                <>
                  <Button
                    type="default"
                    size="small"
                    className={styles["header-button"]}
                    onClick={() => {
                      if (expandedKeys.length > 0) {
                        handleCollapseAll();
                      } else {
                        handleExpandAll();
                      }
                    }}
                    style={{
                      color: "#344054",
                      border: "1px solid #d0d5dd",
                      background: "#ffffff",
                      borderRadius: 6,
                      height: 28,
                      width: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    icon={
                      expandedKeys.length > 0 ? (
                        <FolderOpenOutlined />
                      ) : (
                        <ExpandAltOutlined />
                      )
                    }
                  />
                  <Button
                    type="default"
                    size="small"
                    className={styles["header-button"]}
                    onClick={handleRootAddFolder}
                    style={{
                      color: "#344054",
                      border: "1px solid #d0d5dd",
                      background: "#ffffff",
                      borderRadius: 6,
                      height: 28,
                      width: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    icon={<FolderAddOutlined />}
                  />
                  <Button
                    type="default"
                    size="small"
                    className={styles["header-button"]}
                    onClick={() => setIsSearchOpen(true)}
                    style={{
                      color: "#344054",
                      border: "1px solid #d0d5dd",
                      background: "#ffffff",
                      borderRadius: 6,
                      height: 28,
                      width: 28,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    icon={<SearchOutlined />}
                  />
                </>
              )}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  height: 28,
                  width: isSearchOpen ? "100%" : 0,
                  transition: "width 250ms ease",
                  overflow: "hidden",
                }}
              >
                <Input
                  allowClear
                  placeholder="Tìm kiếm"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onBlur={() => {
                    if (!searchValue.trim()) {
                      setIsSearchOpen(false);
                    }
                  }}
                  onPressEnter={() => {
                    if (!searchValue.trim()) {
                      setIsSearchOpen(false);
                    }
                  }}
                  onClear={() => {
                    setSearchValue("");
                  }}
                  ref={searchInputRef}
                  style={{
                    width: "100%",
                    height: 28,
                    lineHeight: "28px",
                    padding: "4px 8px",
                    boxSizing: "border-box",
                    opacity: isSearchOpen ? 1 : 0,
                    transform: isSearchOpen
                      ? "translateX(0)"
                      : "translateX(12px)",
                    transition: "opacity 250ms ease, transform 250ms ease",
                    pointerEvents: isSearchOpen ? "auto" : "none",
                  }}
                />
              </div>
            </div>
          </div>
        )}
        {/* Root Add Button (kept for standalone usage) */}
        {editable && showRootAddButton && !showHeaderControls && (
          <div
            style={{
              marginBottom: "8px",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              type="text"
              size="small"
              icon={<FolderAddOutlined />}
              onClick={handleRootAddFolder}
              style={{
                color: "#155eef",
                border: "1px dashed #155eef",
                borderRadius: "4px",
                height: "28px",
                width: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            />
          </div>
        )}

        {/* Tree Content - Scrollable */}
        <div
          style={{
            flex: 1,
            overflow: "auto", // Allow scrolling
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {loading ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: "16px",
              }}
            >
              <Spin size="large" />
              <div style={{ fontSize: "14px", color: "#666" }}>
                Đang tải thư mục...
              </div>
            </div>
          ) : treeData.length > 0 ? (
            <Tree
              showIcon
              showLine
              treeData={treeData}
              selectedKeys={selectedKeys}
              expandedKeys={expandedKeys}
              onSelect={handleSelect}
              onExpand={handleExpand}
              onRightClick={handleRightClick}
              motion={treeMotion}
              draggable={draggable}
              onDrop={handleDrop}
              className={styles["folder-tree"]}
              style={{
                padding: "8px",
                backgroundColor: "#fff",
                minWidth: "max-content",
                width: "max-content",
              }}
              blockNode
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "16px",
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có dữ liệu"
              />
            </div>
          )}
        </div>

        {/* Modal */}
        <Modal
          title={modalTitle}
          open={modalVisible}
          onOk={handleModalConfirm}
          onCancel={() => setModalVisible(false)}
          confirmLoading={loading}
          okText="Xác nhận"
          cancelText="Hủy"
          width={600}
        >
          <Form layout="vertical">
            {/* Tên checklist/thư mục */}
            <Form.Item
              label={
                modalType.includes("folder") ? "Tên thư mục" : "Tên checklist"
              }
              required
            >
              <Input
                placeholder={`Nhập tên ${
                  modalType.includes("folder") ? "thư mục" : "checklist"
                }`}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                onPressEnter={handleModalConfirm}
                autoFocus
              />
            </Form.Item>


            {/* File đính kèm - chỉ hiển thị cho file/checklist */}
            {modalType !== "add-folder" && (
              <Form.Item label="File đính kèm">
                <FileUpload
                  maxFiles={3}
                  maxSize={10}
                  onFilesChange={(files) =>
                    setFormData({ ...formData, attachments: files })
                  }
                  initialFiles={formData.attachments}
                />
              </Form.Item>
            )}

            {/* Môi trường kiểm thử */}
            {modalType !== "add-folder" && (
              <Form.Item label="Môi trường kiểm thử">
                <Radio.Group
                  value={formData.environment}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      environment: e.target.value as "web" | "app" | "desktop",
                    })
                  }
                >
                  <Radio value="web">Web</Radio>
                  <Radio value="app">App</Radio>
                  <Radio value="desktop">Desktop</Radio>
                </Radio.Group>
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* Context Menu */}
        {contextMenuVisible && contextMenuNode && (
          <div
            style={{
              position: "fixed",
              left: contextMenuPosition.x,
              top: contextMenuPosition.y,
              zIndex: 1000,
              backgroundColor: "#fff",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              minWidth: "160px",
              padding: "4px 0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Add Folder */}
            <div
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#374151",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onClick={() => {
                if (onCreateFolderClick && contextMenuNode) {
                  onCreateFolderClick(contextMenuNode.id);
                } else {
                  showModal("add-folder", contextMenuNode);
                }
                setContextMenuVisible(false);
              }}
            >
              <FolderOutlined style={{ color: "#6b7280" }} />
              Tạo thư mục con
            </div>

            {/* Add File */}
            <div
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#374151",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onClick={() => {
                if (onCreateChecklistClick && contextMenuNode) {
                  onCreateChecklistClick(contextMenuNode.id);
                } else {
                  showModal("add-file", contextMenuNode);
                }
                setContextMenuVisible(false);
              }}
            >
              <FileOutlined style={{ color: "#6b7280" }} />
              Tạo checklist
            </div>

            {/* Divider */}
            <div
              style={{
                height: "1px",
                backgroundColor: "#e5e7eb",
                margin: "4px 0",
              }}
            />

            {/* Edit */}
            <div
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#374151",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f3f4f6";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onClick={() => {
                // console.log("Edit clicked for node:", contextMenuNode);
                if (contextMenuNode) {
                  if (contextMenuNode.type === "folder" && onEditFolder) {
                    // console.log(
                    //   "Calling onEditFolder with id:",
                    //   contextMenuNode.id
                    // );
                    // Call parent's edit folder function (opens new popup)
                    onEditFolder(contextMenuNode.id);
                  } else if (contextMenuNode.type === "file" && onEditFile) {
                    // console.log(
                    //   "Calling onEditFile with id:",
                    //   contextMenuNode.id
                    // );
                    // Call parent's edit checklist function (opens new popup)
                    onEditFile(contextMenuNode.id);
                  } else {
                    // console.log(
                    //   "No handler found - type:",
                    //   contextMenuNode.type,
                    //   "onEditFolder:",
                    //   `!!onEditFolder`,
                    //   "onEditFile:",
                    //   `!!onEditFile`
                    // );
                  }
                }
                setContextMenuVisible(false);
              }}
            >
              <EditOutlined style={{ color: "#6b7280" }} />
              {contextMenuNode?.type === "folder"
                ? "Sửa thư mục"
                : "Sửa checklist"}
            </div>

            {/* Delete */}
            <div
              style={{
                padding: "8px 16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "14px",
                color: "#dc2626",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#fef2f2";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
              }}
              onClick={() => {
                handleDelete(contextMenuNode);
                setContextMenuVisible(false);
              }}
            >
              <DeleteOutlined style={{ color: "#dc2626" }} />
              Xóa
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          title={`Xóa ${nodeToDelete?.type === "folder" ? "thư mục" : "file"}`}
          open={deleteModalVisible}
          onOk={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{
            danger: true,
            style: {
              backgroundColor: "#dc2626",
              borderColor: "#dc2626",
            },
          }}
        >
          <p>Bạn có chắc chắn muốn xóa &quot;{nodeToDelete?.title}&quot;?</p>
          {nodeToDelete?.type === "folder" && (
            <p style={{ color: "#dc2626", fontSize: "14px", marginTop: "8px" }}>
              Tất cả thư mục và file con bên trong cũng sẽ bị xóa.
            </p>
          )}
        </Modal>
      </div>
    );
  }
);

FolderTree.displayName = "FolderTree";

export default FolderTree;
