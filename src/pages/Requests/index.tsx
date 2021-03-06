/** @jsx jsx */
import { jsx } from '@emotion/core'
import styled from '@emotion/styled/macro'
import css from '@emotion/css/macro'
import { ModalConsumer, ModalProvider } from '@sumup/circuit-ui'
import { ModalProps } from '@sumup/circuit-ui/dist/cjs/components/Modal/Modal'
import { ListRowRenderer } from 'react-virtualized/dist/es/List'
import tw from 'twin.macro'
import omit from 'lodash-es/omit'
import React, { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import { List, AutoSizer } from 'react-virtualized'
import PageTitle from '../../components/PageTitle'

import { RecentRequests, RequestItem } from '../../types'
import fetcher from '../../utils/fetcher'
import ListItem from './components/ListItem'
import RequestModal from './components/RequestModal'

const LIST_ITEMS_MAX = 150

const Page: React.FC = () => {
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true)
  const { data: requests, error: requestsError } = useSWR<RecentRequests>(
    '/requests/recent',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: isAutoRefresh ? 5000 : 0,
    },
  )
  const [requestList, setRequestList] = useState<Array<RequestItem>>([])

  useEffect(() => {
    let newList = [...requestList]
    const pendingList = requests?.requests?.slice(0, LIST_ITEMS_MAX) ?? []

    while (pendingList.length) {
      const request = pendingList.pop() as RequestItem
      const existingIndex = newList.findIndex((item) => item.id === request.id)

      if (existingIndex >= 0) {
        Object.assign(newList[existingIndex], omit(request, ['id']))
      } else {
        if (newList.length && request.id > newList[0].id) {
          newList.unshift(request)
        } else {
          newList.push(request)
        }
      }
    }

    newList = newList.slice(0, LIST_ITEMS_MAX)
    setRequestList(newList)
  }, [requests])

  const openRequestDetail = useCallback(
    (setModal: (modal: ModalProps) => void, req: RequestItem) => {
      setModal({
        children({ onClose }) {
          return <RequestModal req={req} onClose={onClose} />
        },
        onClose() {
          // noop
        },
      })
    },
    [],
  )

  const getRowRenderer: (
    setModal: (modal: ModalProps) => void,
  ) => ListRowRenderer = useCallback(
    (setModal) => {
      // eslint-disable-next-line react/display-name
      return ({
        key, // Unique key within array of rows
        index, // Index of row within collection
        isScrolling, // The List is currently being scrolled
        isVisible, // This row is visible within the List (eg it is not an overscanned row)
        style, // Style object to be applied to row (to position it)
      }) => {
        const req = requestList[index]

        return (
          <div
            key={key}
            style={style}
            onClick={() => openRequestDetail(setModal, req)}
            tw="flex flex-col justify-center py-2 cursor-pointer hover:bg-gray-100"
            css={css`
              padding-left: calc(env(safe-area-inset-left) + 0.75rem);
              padding-right: calc(env(safe-area-inset-right) + 0.75rem);
            `}>
            <ListItem req={req} />
          </div>
        )
      }
    },
    [requestList, openRequestDetail],
  )

  return (
    <div tw="fixed top-0 right-0 bottom-0 left-0 h-full">
      <ModalProvider>
        <ModalConsumer>
          {({ setModal }) => {
            return (
              <div tw="w-full h-full flex flex-col">
                <PageTitle
                  title="Requests"
                  hasAutoRefresh={true}
                  defaultAutoRefreshState={true}
                  onAuthRefreshStateChange={(newState) =>
                    setIsAutoRefresh(newState)
                  }
                />

                <div tw="flex-1">
                  <AutoSizer>
                    {({ width, height }) => {
                      return (
                        <List
                          width={width}
                          height={height}
                          rowCount={requestList.length}
                          rowHeight={85}
                          rowRenderer={getRowRenderer(setModal)}
                          style={{
                            outline: 'none',
                          }}
                          css={css`
                            & > div {
                              ${tw`divide-y divide-gray-200`}
                            }
                          `}
                        />
                      )
                    }}
                  </AutoSizer>
                </div>
              </div>
            )
          }}
        </ModalConsumer>
      </ModalProvider>
    </div>
  )
}

export default Page
