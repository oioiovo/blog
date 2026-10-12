import type { Metadata } from 'next'
import { CommitLog } from '@/components/commit-log'
import { PostTree } from '@/components/post-tree'
import { PostsExplorer } from '@/components/posts-explorer'
import { buildPostTree, getAllPosts, getAllTags } from '@/lib/posts'

export const metadata: Metadata = {
  title: '全部文章',
  description: '全部技术文章，可按时间线或目录结构浏览，并按标签筛选。',
}

export default function PostsPage() {
  const allPosts = getAllPosts()
  const tags = getAllTags().map(([name, count]) => ({ name, count }))

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-14">
      <aside className="lg:sticky lg:top-24 lg:pl-0" aria-label="文章目录">
        <PostTree root={buildPostTree(allPosts)} />
      </aside>

      <PostsExplorer posts={allPosts} tags={tags} />
    </div>
  )
}
