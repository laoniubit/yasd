/** @jsx jsx */
import { jsx } from '@emotion/core'
import styled from '@emotion/styled/macro'
import css from '@emotion/css/macro'
import { Heading } from '@sumup/circuit-ui'
import { Spinner } from '@sumup/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import tw from 'twin.macro'
import React, { useState } from 'react'
import useSWR from 'swr'

import { DataGroup, DataRow, DataRowMain } from '../../components/Data'
import { ConnectorTraffic, Traffic } from '../../types'
import fetcher from '../../utils/fetcher'
import TrafficDataCell from './components/TrafficDataCell'

dayjs.extend(relativeTime)

const TrafficWrapper = styled.div`
  ${tw`px-4`}
`

const Page: React.FC = () => {
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(false)
  const { data: traffic, error: trafficError } = useSWR<Traffic>(
    '/traffic',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: isAutoRefresh ? 2000 : 0,
    },
  )

  const getSortedTraffic = (
    connector: Traffic['connector'],
  ): Array<ConnectorTraffic & { name: string }> => {
    const result: Array<ConnectorTraffic & { name: string }> = []

    if (!traffic) {
      return result
    }

    Object.keys(connector).forEach((name) => {
      result.push({
        name,
        ...connector[name],
      })
    })

    return result.sort((a, b) => {
      return b.in + b.out - (a.in + a.out)
    })
  }

  return (
    <div tw={'relative pb-5'}>
      <Heading
        size={'tera'}
        noMargin
        tw="sticky top-0 flex items-center justify-between shadow bg-white z-10 px-3 py-3 mb-4">
        <div>Traffic</div>

        <div
          onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          css={[
            tw`bg-blue-500 text-white cursor-pointer w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-200 ease-in-out `,
            isAutoRefresh && tw`bg-red-400`,
          ]}>
          <Spinner css={[tw`w-6 h-6`, isAutoRefresh && tw`animate-spin`]} />
        </div>
      </Heading>

      {traffic && (
        <TrafficWrapper>
          <DataGroup>
            <DataRow>
              <DataRowMain>
                <div>开启时间</div>
                <div>{dayjs.unix(traffic.startTime).format()}</div>
              </DataRowMain>
            </DataRow>
            <DataRow>
              <DataRowMain>
                <div>启动时长</div>
                <div>{dayjs.unix(traffic.startTime).toNow(true)}</div>
              </DataRowMain>
            </DataRow>
          </DataGroup>

          <DataGroup>
            {Object.keys(traffic.interface).map((name) => {
              const data = traffic.interface[name]
              return <TrafficDataCell key={name} name={name} data={data} />
            })}
          </DataGroup>

          <DataGroup>
            {getSortedTraffic(traffic.connector).map((data) => {
              const name = data.name
              return <TrafficDataCell key={name} name={name} data={data} />
            })}
          </DataGroup>
        </TrafficWrapper>
      )}
    </div>
  )
}

export default Page