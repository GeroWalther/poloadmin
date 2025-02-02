import ArticleForm from './ArticleForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './components/ui/dialog';

interface Article {
  id: string;
  title: string;
  description: string;
  title_image?: string;
  sections?: {
    subheading?: string;
    text?: string;
    images?: string[];
  }[];
  created_at: string;
}

interface EditArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: Article | null;
  fetchArticles: () => void;
}

export default function EditArticleModal({
  isOpen,
  onClose,
  article,
  fetchArticles,
}: EditArticleModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Article</DialogTitle>
        </DialogHeader>
        <div className='mt-4'>
          <ArticleForm
            fetchArticles={fetchArticles}
            articleToEdit={article}
            onCancelEdit={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
